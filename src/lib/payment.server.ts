import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const SUPABASE_URL      = "https://swxrdjijzvzsrqrrvbdr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eHJkamlqenZ6c3JxcnJ2YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTE0ODgsImV4cCI6MjA5NzA4NzQ4OH0.k5QznDN4GtZsKMOly3j-FpWd3OkN52gtRELt7HIUlU8";

const KHALTI_BASE = "https://dev.khalti.com/api/v2"; // Khalti sandbox

// ─── Khalti ───────────────────────────────────────────────────────
// Initiates a Khalti e-payment session. Returns the payment_url to
// redirect the user to. Amount must be in paisa (NPR × 100).
export const khaltiInitiate = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    orderId:     z.string(),
    totalAmount: z.number(),
    productName: z.string(),
    buyerName:   z.string(),
    buyerEmail:  z.string(),
    buyerPhone:  z.string(),
    returnUrl:   z.string(),
    websiteUrl:  z.string(),
  }))
  .handler(async ({ data }) => {
    const secret = (process.env.KHALTI_SECRET_KEY ?? "").replace(/^﻿/, "").trim();
    const res = await fetch(`${KHALTI_BASE}/epayment/initiate/`, {
      method:  "POST",
      headers: {
        "Authorization": `Key ${secret}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        return_url:          data.returnUrl,
        website_url:         data.websiteUrl,
        amount:              Math.round(data.totalAmount * 100), // NPR → paisa
        purchase_order_id:   data.orderId,
        purchase_order_name: data.productName,
        customer_info: {
          name:  data.buyerName,
          email: data.buyerEmail,
          phone: data.buyerPhone,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Khalti initiate failed: ${err}`);
    }
    const json = await res.json() as { pidx: string; payment_url: string };
    return { pidx: json.pidx, paymentUrl: json.payment_url };
  });

// Verifies a Khalti payment via the lookup API after the user returns
// from Khalti's hosted checkout. Uses the pidx from the callback params.
export const khaltiVerify = createServerFn({ method: "POST" })
  .inputValidator(z.object({ pidx: z.string() }))
  .handler(async ({ data }) => {
    const secret = (process.env.KHALTI_SECRET_KEY ?? "").replace(/^﻿/, "").trim();
    const res = await fetch(`${KHALTI_BASE}/epayment/lookup/`, {
      method:  "POST",
      headers: {
        "Authorization": `Key ${secret}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ pidx: data.pidx }),
    });
    if (!res.ok) {
      return { valid: false, transactionId: "", orderId: "" };
    }
    const json = await res.json() as {
      status: string;
      transaction_id?: string;
      purchase_order_id?: string;
    };
    return {
      valid:         json.status === "Completed",
      transactionId: json.transaction_id ?? "",
      orderId:       json.purchase_order_id ?? "",
    };
  });

// ─── Shared email transport factory ──────────────────────────────
function makeTransport() {
  const clean = (v: string | undefined, fallback = "") =>
    (v ?? fallback).replace(/^﻿/, "").trim();
  return nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: {
      user: clean(process.env.SMTP_USER, "teamkalpantrix@gmail.com"),
      pass: clean(process.env.SMTP_PASS),
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

const fmtNpr = (n: number | string) =>
  Number(n).toLocaleString("en-IN");

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

    const transport    = makeTransport();
    const deliveryLine = o.delivery_address ? `${o.delivery} — ${o.delivery_address}` : o.delivery;

    // Send emails — wrapped so a failure never blocks the OTP being returned
    try {
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
              ["Total",    `Rs ${fmtNpr(o.total)}`, true],
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
              ["Total",    `Rs ${fmtNpr(o.total)}`, true],
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
      console.log("[finalizeOrderAndNotify] emails sent ok");
    } catch (mailErr: any) {
      console.error("[finalizeOrderAndNotify] email failed (OTP still saved in DB):", mailErr?.message ?? mailErr);
    }

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

// ─── Buyer → Seller message notification ─────────────────────────
// Fetches seller email from profiles, then emails them the buyer's message.
// reply-to is set to buyer's email so seller can reply directly in Gmail.
export const notifySellerMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    sellerId:     z.string(),
    buyerName:    z.string(),
    buyerEmail:   z.string(),
    listingTitle: z.string(),
    message:      z.string(),
  }))
  .handler(async ({ data }) => {
    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: seller } = await db
      .from("profiles")
      .select("email, full_name")
      .eq("id", data.sellerId)
      .single();

    if (!seller?.email) throw new Error("Seller email not found.");

    const transport = makeTransport();
    await transport.sendMail({
      from:    FROM,
      to:      seller.email,
      replyTo: data.buyerEmail,
      subject: `Message about your listing — ${data.listingTitle}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        ${emailHeader("You have a new message!", `${data.buyerName} is interested in your listing`)}
        <div style="border:1px solid #e5e5e5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
          ${orderTable([
            ["From",    data.buyerName],
            ["Email",   `<a href="mailto:${data.buyerEmail}" style="color:#c0392b">${data.buyerEmail}</a>`],
            ["Listing", data.listingTitle],
          ])}
          <div style="background:#f9f9f9;border-left:4px solid #c0392b;padding:16px 20px;border-radius:6px;font-size:14px;line-height:1.7;white-space:pre-wrap">
            ${data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </div>
          <div style="margin-top:20px;padding:14px 18px;background:#fff8e1;border-radius:8px;font-size:13px;color:#92400e">
            💡 Hit <strong>Reply</strong> in your email to respond directly to ${data.buyerName}.
          </div>
          ${emailFooter()}
        </div>
      </div>`,
    });
  });

// ─── Contact form notification ────────────────────────────────────
// Saves to DB (server-side, bypasses RLS) and emails both admin and sender.
// Works for any visitor — no auth required.
export const notifyContactMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name:    z.string(),
    email:   z.string(),
    subject: z.string(),
    message: z.string(),
  }))
  .handler(async ({ data }) => {
    // Save to DB — best-effort, never blocks the response
    try {
      const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;
      const db = createClient(SUPABASE_URL, dbKey);
      const { error } = await db.from("contact_messages").insert({
        name:    data.name,
        email:   data.email,
        subject: data.subject,
        message: data.message,
      });
      if (error) console.error("[contact] DB insert failed:", error.message);
    } catch (dbErr: any) {
      console.error("[contact] DB insert threw:", dbErr?.message ?? dbErr);
    }

    const safeMsg = data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Email 1 — admin notification (best-effort)
    try {
      const transport = makeTransport();
      await transport.sendMail({
        from:    FROM,
        to:      "teamkalpantrix@gmail.com",
        replyTo: data.email,
        subject: `[Contact] ${data.subject}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          ${emailHeader("New contact message", `From ${data.name} via Second Sync`)}
          <div style="border:1px solid #e5e5e5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
            ${orderTable([
              ["From",    data.name],
              ["Email",   `<a href="mailto:${data.email}" style="color:#c0392b">${data.email}</a>`],
              ["Subject", data.subject],
            ])}
            <div style="background:#f9f9f9;border-left:4px solid #c0392b;padding:16px 20px;border-radius:6px;white-space:pre-wrap;font-size:14px;line-height:1.6">
              ${safeMsg}
            </div>
            <p style="margin:20px 0 0;font-size:12px;color:#888">
              Reply directly to this email — it will go to ${data.email}
            </p>
          </div>
        </div>`,
      });
    } catch (e: any) {
      console.error("[contact] admin email failed:", e?.message ?? e);
    }

    // Email 2 — confirmation to the sender (best-effort)
    try {
      const transport = makeTransport();
      await transport.sendMail({
        from:    FROM,
        to:      data.email,
        subject: `We received your message — Second Sync`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          ${emailHeader("Thanks for reaching out!", `Hi ${data.name}, we've got your message`)}
          <div style="border:1px solid #e5e5e5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6">
              We received your message and will get back to you within <strong>24 hours</strong>.
            </p>
            ${orderTable([["Subject", data.subject]])}
            <div style="background:#f9f9f9;border-left:4px solid #c0392b;padding:16px 20px;border-radius:6px;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#555">
              ${safeMsg}
            </div>
            <p style="margin:20px 0 0;font-size:13px;color:#888">
              If you didn't send this message, you can safely ignore this email.
            </p>
            ${emailFooter()}
          </div>
        </div>`,
      });
    } catch (e: any) {
      console.error("[contact] sender email failed:", e?.message ?? e);
    }
  });
