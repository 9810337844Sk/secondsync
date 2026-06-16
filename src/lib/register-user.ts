import { createServerFn } from "@tanstack/react-start";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://swxrdjijzvzsrqrrvbdr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eHJkamlqenZ6c3JxcnJ2YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTE0ODgsImV4cCI6MjA5NzA4NzQ4OH0.k5QznDN4GtZsKMOly3j-FpWd3OkN52gtRELt7HIUlU8";

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function makeTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: "teamkalpantrix@gmail.com", pass: "rdahsrzbgfxknpsb" },
  });
}

export const registerUser = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string; full_name: string; phone: string }) => d)
  .handler(async ({ data }) => {
    // Create user directly via SECURITY DEFINER SQL function — bypasses Supabase auth rate limits
    const { data: result, error } = await db.rpc("create_user_account", {
      p_email: data.email,
      p_password: data.password,
      p_full_name: data.full_name,
      p_phone: data.phone,
    });

    if (error) {
      if (error.message.toLowerCase().includes("duplicate") || error.message.toLowerCase().includes("already exists")) {
        // User already exists — just send a new verification code
      } else {
        throw new Error(error.message);
      }
    }

    // Generate and store verification code, then send email
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.rpc("store_verification_code", { p_email: data.email, p_code: code });

    const transport = makeTransport();
    await transport.sendMail({
      from: '"Second Sync" <teamkalpantrix@gmail.com>',
      to: data.email,
      subject: "Your Second Sync Verification Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;">
          <div style="text-align:center;margin-bottom:24px;">
            <h2 style="color:#5c0018;font-size:24px;margin:0;">Second Sync</h2>
            <p style="color:#666;font-size:13px;margin-top:4px;">Nepal's second-hand marketplace</p>
          </div>
          <h3 style="color:#111;font-size:18px;">Verify your email address</h3>
          <p style="color:#555;font-size:15px;">Use the code below to verify your account:</p>
          <div style="background:#f5f0e8;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#5c0018;">${code}</span>
          </div>
          <p style="color:#888;font-size:13px;">This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#aaa;font-size:12px;text-align:center;">Second Sync — किन्नुहोस्, बेच्नुहोस्, पुन: प्रयोग गर्नुहोस्</p>
        </div>
      `,
    });

    return { ok: true };
  });
