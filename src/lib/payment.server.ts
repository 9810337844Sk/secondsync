import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const SUPABASE_URL      = "https://swxrdjijzvzsrqrrvbdr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eHJkamlqenZ6c3JxcnJ2YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTE0ODgsImV4cCI6MjA5NzA4NzQ4OH0.k5QznDN4GtZsKMOly3j-FpWd3OkN52gtRELt7HIUlU8";

const ESEWA_MERCHANT  = "EPAYTEST";
const ESEWA_SECRET    = "8gBm/:&EnhH.1/q";   // eSewa RC test secret
const ESEWA_URL       = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const KHALTI_URL      = "https://dev.khalti.com/api/v2";
const KHALTI_TEST_KEY = "test_secret_key_68791341fdd94846a146f7b51e44c9cd";

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
    const secret    = process.env.ESEWA_SECRET_KEY ?? ESEWA_SECRET;
    // eSewa requires integer strings; must match exactly in HMAC + form fields.
    const totalStr  = String(Math.round(data.totalAmount));
    const amtStr    = String(Math.round(data.itemAmount));
    const delivStr  = String(Math.round(data.deliveryCharge));
    // Canonical message per eSewa v2 docs
    const message   =
      `total_amount=${totalStr},` +
      `transaction_uuid=${data.transactionUuid},` +
      `product_code=${ESEWA_MERCHANT}`;
    const sig = createHmac("sha256", secret).update(message).digest("base64");
    return {
      action:                  ESEWA_URL,
      amount:                  amtStr,
      tax_amount:              "0",
      total_amount:            totalStr,
      transaction_uuid:        data.transactionUuid,
      product_code:            ESEWA_MERCHANT,
      product_service_charge:  "0",
      product_delivery_charge: delivStr,
      signed_field_names:      "total_amount,transaction_uuid,product_code",
      signature:               sig,
    };
  });

// Verifies eSewa's signed response (base64-encoded JSON returned in ?data=).
export const esewaVerify = createServerFn({ method: "POST" })
  .inputValidator(z.object({ encodedData: z.string() }))
  .handler(async ({ data }) => {
    try {
      // eSewa URL-encodes the base64 string — decode it first
      const raw     = decodeURIComponent(data.encodedData);
      const decoded = JSON.parse(
        Buffer.from(raw, "base64").toString("utf-8"),
      ) as Record<string, string>;
      const secret  = process.env.ESEWA_SECRET_KEY ?? ESEWA_SECRET;
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
    const key = process.env.KHALTI_SECRET_KEY ?? KHALTI_TEST_KEY;
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
    const key = process.env.KHALTI_SECRET_KEY ?? KHALTI_TEST_KEY;
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

// ─── eSewa Dev Simulator ─────────────────────────────────────────
// When eSewa's RC (sandbox) server is down, call this instead of
// submitting the real form. It produces a correctly-signed eSewa
// response payload that esewaVerify will accept, so the full
// verify → confirm_order → OTP pipeline runs normally.
// Only active in development (NODE_ENV !== "production").
export const esewaSimulateDev = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    orderId:     z.string(),
    totalAmount: z.number(),
  }))
  .handler(async ({ data }) => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("esewaSimulateDev is not available in production.");
    }
    const secret   = process.env.ESEWA_SECRET_KEY ?? ESEWA_SECRET;
    const totalStr = String(Math.round(data.totalAmount));

    // Build a mock eSewa response identical to what their server sends back
    const payload: Record<string, string> = {
      transaction_code:   "DEV" + data.orderId.slice(0, 8).toUpperCase().replace(/-/g, ""),
      status:             "COMPLETE",
      total_amount:       totalStr,
      transaction_uuid:   data.orderId,   // this IS our orderId
      product_code:       ESEWA_MERCHANT,
      signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
    };

    // Compute real HMAC so esewaVerify passes without changes
    const fields  = payload.signed_field_names.split(",");
    const message = fields.map(f => `${f}=${payload[f]}`).join(",");
    payload.signature = createHmac("sha256", secret).update(message).digest("base64");

    // Return as base64 — the payment-success page reads ?data=<this>
    return {
      encodedData: Buffer.from(JSON.stringify(payload)).toString("base64"),
    };
  });

// ─── Shared email transport factory ──────────────────────────────
function makeTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: {
      user: process.env.SMTP_USER ?? "teamkalpantrix@gmail.com",
      pass: process.env.SMTP_PASS ?? "",
    },
  });
}

const FROM = '"Second Sync" <teamkalpantrix@gmail.com>';

function emailHeader(title: string, subtitle: string) {
  return `
    <div style="background:#c0392b;padding:24px 32px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;color:#fff;font-size:22px">${title}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">${subtitle}</p>
    </div>`;
}

function emailFooter() {
  return `<p style="margin:24px 0 0;font-size:12px;color:#888">
    Manage your orders at <a href="https://secondsync.app/dashboard" style="color:#c0392b">Second Sync Dashboard</a>
  </p>`;
}

function orderTable(rows: [string, string, bold?: boolean][]) {
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    ${rows.map(([k, v, bold], i) => `
      <tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#fff"}">
        <td style="padding:10px 14px;font-weight:600;width:36%">${k}</td>
        <td style="padding:10px 14px;${bold ? "font-weight:700;color:#c0392b;font-size:16px" : ""}">${v}</td>
      </tr>`).join("")}
  </table>`;
}

// ─── Escrow OTP ───────────────────────────────────────────────────
// Generates a 6-digit delivery OTP, stores it on the confirmed order,
// and emails both seller and buyer.
export const finalizeOrderAndNotify = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    orderId: z.string(),
    buyerId: z.string(),
  }))
  .handler(async ({ data }) => {
    const db  = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const otp = randomInt(100000, 1000000).toString();

    console.log("[finalizeOrderAndNotify] calling RPC for order", data.orderId);
    const { data: info, error } = await db.rpc("confirm_and_prepare_delivery", {
      p_order_id: data.orderId,
      p_buyer_id: data.buyerId,
      p_otp:      otp,
    });
    if (error) {
      console.error("[finalizeOrderAndNotify] RPC error:", error.message);
      throw new Error(error.message);
    }

    const o = info as Record<string, any>;
    console.log("[finalizeOrderAndNotify] RPC ok — seller_email:", o.seller_email, "buyer_email:", o.buyer_email);

    const transport   = makeTransport();
    const deliveryLine = o.delivery_address ? `${o.delivery} — ${o.delivery_address}` : o.delivery;

    // ── Email to seller ─────────────────────────────────────────
    console.log("[finalizeOrderAndNotify] sending seller email to:", o.seller_email);
    await transport.sendMail({
      from:    FROM,
      to:      o.seller_email,
      subject: `You have a new order — ${o.listing_title}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        ${emailHeader("You have a new order!", `${o.buyer_name} just paid for your listing`)}
        <div style="border:1px solid #e5e5e5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
          <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em">Item</p>
          <p style="margin:0 0 24px;font-size:20px;font-weight:bold;color:#1a1a1a">${o.listing_title}</p>
          ${orderTable([
            ["Buyer",    o.buyer_name],
            ["Phone",    `+977-${o.buyer_phone}`],
            ["Email",    o.buyer_email],
            ["Delivery", deliveryLine],
            ...(o.note ? [["Note", `<em>${o.note}</em>`] as [string,string]] : []),
            ["Total",    `Rs ${o.total}`, true],
          ])}
          <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:6px">
            <p style="margin:0;font-weight:700;font-size:14px">What to do next:</p>
            <p style="margin:8px 0 0;font-size:14px;color:#555">
              When you hand over the item to the buyer, ask them for their <strong>6-digit delivery code</strong>.
              Enter it in <em>Dashboard → Sales</em> to confirm delivery and complete the transaction.
            </p>
          </div>
          ${emailFooter()}
        </div>
      </div>`,
    });

    // ── Email to buyer ──────────────────────────────────────────
    console.log("[finalizeOrderAndNotify] sending buyer email to:", o.buyer_email);
    await transport.sendMail({
      from:    FROM,
      to:      o.buyer_email,
      subject: `Your order is confirmed — ${o.listing_title}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        ${emailHeader("Your order is confirmed!", "Payment received — your item is on its way")}
        <div style="border:1px solid #e5e5e5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
          <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em">Item</p>
          <p style="margin:0 0 24px;font-size:20px;font-weight:bold;color:#1a1a1a">${o.listing_title}</p>
          ${orderTable([
            ["Payment",  String(o.payment).toUpperCase()],
            ["Delivery", deliveryLine],
            ...(o.note ? [["Note", `<em>${o.note}</em>`] as [string,string]] : []),
            ["Total",    `Rs ${o.total}`, true],
          ])}
          <div style="background:#fff8e1;border:2px solid #f59e0b;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#92400e;letter-spacing:0.08em;text-transform:uppercase">Your Delivery Code</p>
            <p style="margin:0;font-size:52px;font-weight:900;letter-spacing:0.25em;color:#1a1a1a;line-height:1.1">${otp}</p>
            <p style="margin:14px 0 0;font-size:13px;color:#92400e;line-height:1.5">
              Give this code to the seller <strong>only when they hand you the item</strong>.<br>
              This confirms delivery and completes your transaction.
            </p>
          </div>
          <p style="margin:0;font-size:13px;color:#888">You can also find this code anytime in <strong>Dashboard → My Orders</strong>.</p>
          ${emailFooter()}
        </div>
      </div>`,
    });

    console.log("[finalizeOrderAndNotify] all emails sent, otp:", otp);
    return { otp };
  });

// ─── Completion notification ──────────────────────────────────────
// Called after seller verifies OTP — sends confirmation emails to both parties.
export const notifyOrderCompleted = createServerFn({ method: "POST" })
  .inputValidator(z.object({ orderId: z.string(), sellerId: z.string() }))
  .handler(async ({ data }) => {
    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: order } = await db
      .from("orders")
      .select("listing_title, buyer_name, buyer_email, seller_id, total, payment, delivery")
      .eq("id", data.orderId)
      .eq("seller_id", data.sellerId)
      .single();

    if (!order) return;

    const { data: sellerProfile } = await db
      .from("profiles")
      .select("email, full_name")
      .eq("id", data.sellerId)
      .single();

    const transport = makeTransport();

    // ── Email to buyer ──────────────────────────────────────────
    if (order.buyer_email) {
      await transport.sendMail({
        from:    FROM,
        to:      order.buyer_email,
        subject: `Your delivery is confirmed — ${order.listing_title}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          ${emailHeader("Your delivery is confirmed!", "The seller has completed the transaction")}
          <div style="border:1px solid #e5e5e5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
            ${orderTable([
              ["Item",    order.listing_title],
              ["Payment", String(order.payment).toUpperCase()],
              ["Total",   `Rs ${order.total}`, true],
            ])}
            <p style="margin:0;font-size:14px;color:#555">Thank you for using Second Sync. Enjoy your item!</p>
            ${emailFooter()}
          </div>
        </div>`,
      });
    }

    // ── Email to seller ─────────────────────────────────────────
    if (sellerProfile?.email) {
      await transport.sendMail({
        from:    FROM,
        to:      sellerProfile.email,
        subject: `Your item is sold — ${order.listing_title}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          ${emailHeader("Your item is sold!", "Delivery confirmed — transaction complete")}
          <div style="border:1px solid #e5e5e5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
            ${orderTable([
              ["Item",    order.listing_title],
              ["Buyer",   order.buyer_name],
              ["Payment", String(order.payment).toUpperCase()],
              ["Amount",  `Rs ${order.total}`, true],
            ])}
            <p style="margin:0;font-size:14px;color:#555">Thank you for selling on Second Sync!</p>
            ${emailFooter()}
          </div>
        </div>`,
      });
    }
  });
