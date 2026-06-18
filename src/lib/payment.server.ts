import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const SUPABASE_URL      = "https://swxrdjijzvzsrqrrvbdr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eHJkamlqenZ6c3JxcnJ2YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTE0ODgsImV4cCI6MjA5NzA4NzQ4OH0.k5QznDN4GtZsKMOly3j-FpWd3OkN52gtRELt7HIUlU8";

const ESEWA_MERCHANT = "EPAYTEST";
const ESEWA_URL      = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const KHALTI_URL     = "https://dev.khalti.com/api/v2";

// ─── eSewa ────────────────────────────────────────────────────────
// Returns the HMAC-SHA256 signature and all form fields for eSewa v2.
// The secret key stays server-side; the browser only receives the signature.
export const esewaSign = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    transactionUuid: z.string(),
    itemAmount:      z.number(),
    deliveryCharge:  z.number().default(0),
    totalAmount:     z.number(),
  }))
  .handler(async ({ data }) => {
    const secret  = process.env.ESEWA_SECRET_KEY ?? "8gBm/:&EnhH.1/q";
    const message =
      `total_amount=${data.totalAmount},` +
      `transaction_uuid=${data.transactionUuid},` +
      `product_code=${ESEWA_MERCHANT}`;
    const sig = createHmac("sha256", secret).update(message).digest("base64");
    return {
      action:                  ESEWA_URL,
      amount:                  data.itemAmount,
      tax_amount:              0,
      total_amount:            data.totalAmount,
      transaction_uuid:        data.transactionUuid,
      product_code:            ESEWA_MERCHANT,
      product_service_charge:  0,
      product_delivery_charge: data.deliveryCharge,
      signed_field_names:      "total_amount,transaction_uuid,product_code",
      signature:               sig,
    };
  });

// Verifies eSewa's signed response (base64-encoded JSON returned in ?data=).
export const esewaVerify = createServerFn({ method: "POST" })
  .inputValidator(z.object({ encodedData: z.string() }))
  .handler(async ({ data }) => {
    try {
      const decoded = JSON.parse(
        Buffer.from(data.encodedData, "base64").toString("utf-8"),
      ) as Record<string, string>;
      const secret  = process.env.ESEWA_SECRET_KEY ?? "8gBm/:&EnhH.1/q";
      const fields  = decoded.signed_field_names.split(",");
      const message = fields.map(f => `${f}=${decoded[f]}`).join(",");
      const expected = createHmac("sha256", secret).update(message).digest("base64");
      const valid    = expected === decoded.signature && decoded.status === "COMPLETE";
      return { valid, transactionUuid: decoded.transaction_uuid ?? "" };
    } catch {
      return { valid: false, transactionUuid: "" };
    }
  });

// ─── Khalti ───────────────────────────────────────────────────────
// Calls Khalti's initiate API and returns the hosted payment URL.
export const khaltiInitiate = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    orderId:    z.string(),
    orderName:  z.string(),
    amountNpr:  z.number(),
    returnUrl:  z.string(),
    websiteUrl: z.string(),
  }))
  .handler(async ({ data }) => {
    const key = process.env.KHALTI_SECRET_KEY ??
      "test_secret_key_f59e8b7d18b4499ca40f68195a846e9b";
    const res = await fetch(`${KHALTI_URL}/epayment/initiate/`, {
      method: "POST",
      headers: {
        Authorization:  `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        return_url:          data.returnUrl,
        website_url:         data.websiteUrl,
        amount:              Math.round(data.amountNpr * 100), // NPR → paisa
        purchase_order_id:   data.orderId,
        purchase_order_name: data.orderName.slice(0, 100),
      }),
    });
    if (!res.ok) throw new Error(`Khalti initiate failed: ${await res.text()}`);
    const json = (await res.json()) as { pidx: string; payment_url: string };
    return { pidx: json.pidx, paymentUrl: json.payment_url };
  });

// Looks up a Khalti payment by pidx to verify it completed.
export const khaltiVerify = createServerFn({ method: "POST" })
  .inputValidator(z.object({ pidx: z.string() }))
  .handler(async ({ data }) => {
    const key = process.env.KHALTI_SECRET_KEY ??
      "test_secret_key_f59e8b7d18b4499ca40f68195a846e9b";
    const res = await fetch(`${KHALTI_URL}/epayment/lookup/`, {
      method: "POST",
      headers: {
        Authorization:  `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx: data.pidx }),
    });
    if (!res.ok) throw new Error(`Khalti lookup failed: ${await res.text()}`);
    const json = (await res.json()) as { status: string; purchase_order_id: string };
    return { valid: json.status === "Completed", orderId: json.purchase_order_id };
  });

// ─── Escrow OTP ───────────────────────────────────────────────────
// Generates a 6-digit delivery OTP, stores it on the confirmed order,
// and sends an instant notification email to the seller with buyer details.
export const finalizeOrderAndNotify = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    orderId: z.string(),
    buyerId: z.string(),
  }))
  .handler(async ({ data }) => {
    const db  = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const otp = randomInt(100000, 1000000).toString();

    const { data: info, error } = await db.rpc("confirm_and_prepare_delivery", {
      p_order_id: data.orderId,
      p_buyer_id: data.buyerId,
      p_otp:      otp,
    });
    if (error) throw new Error(error.message);

    const o = info as Record<string, any>;

    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 587, secure: false,
      auth: {
        user: process.env.SMTP_USER ?? "teamkalpantrix@gmail.com",
        pass: process.env.SMTP_PASS ?? "",
      },
    });

    const deliveryLine = o.delivery_address
      ? `${o.delivery} — ${o.delivery_address}`
      : o.delivery;

    await transport.sendMail({
      from:    '"Second Sync" <teamkalpantrix@gmail.com>',
      to:      o.seller_email,
      subject: `🛒 New Paid Order — ${o.listing_title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          <div style="background:#c0392b;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;color:#fff;font-size:22px">New Order Received! 🎉</h1>
          </div>
          <div style="border:1px solid #e5e5e5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
            <p style="margin:0 0 20px">Someone just paid for your listing via <strong>${String(o.payment).toUpperCase()}</strong>.</p>

            <h3 style="margin:0 0 12px;color:#c0392b">📦 Item</h3>
            <p style="margin:0 0 20px;font-size:18px;font-weight:bold">${o.listing_title}</p>

            <h3 style="margin:0 0 12px;color:#c0392b">👤 Buyer Details</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr style="background:#f9f9f9"><td style="padding:10px 14px;font-weight:600">Name</td><td style="padding:10px 14px">${o.buyer_name}</td></tr>
              <tr><td style="padding:10px 14px;font-weight:600">Phone</td><td style="padding:10px 14px">+977-${o.buyer_phone}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:10px 14px;font-weight:600">Email</td><td style="padding:10px 14px">${o.buyer_email}</td></tr>
              <tr><td style="padding:10px 14px;font-weight:600">Delivery</td><td style="padding:10px 14px">${deliveryLine}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:10px 14px;font-weight:600">Total</td><td style="padding:10px 14px;color:#c0392b;font-weight:bold;font-size:16px">Rs ${o.total}</td></tr>
              ${o.note ? `<tr><td style="padding:10px 14px;font-weight:600">Note</td><td style="padding:10px 14px;font-style:italic">${o.note}</td></tr>` : ""}
            </table>

            <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:6px;margin-bottom:20px">
              <p style="margin:0;font-weight:600">⚠️ How to complete this transaction:</p>
              <p style="margin:8px 0 0;font-size:14px">When you deliver the item, ask the buyer for their <strong>6-digit delivery code</strong>. Go to <em>Dashboard → Sales</em> and enter the code to confirm delivery. This releases the payment and removes the listing.</p>
            </div>

            <p style="margin:0;font-size:12px;color:#888">Login at <a href="https://secondsync.app/dashboard" style="color:#c0392b">Second Sync Dashboard</a> to manage this order.</p>
          </div>
        </div>
      `,
    });

    return { otp };
  });
