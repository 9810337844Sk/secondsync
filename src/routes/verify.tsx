import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Mail, RefreshCw, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/send-verification";
import pattern from "@/assets/pattern.jpg";

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s.email === "string" ? s.email : "",
  }),
  head: () => ({
    meta: [{ title: "Verify Email — Second Sync" }],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => { refs[0].current?.focus(); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleDigit(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs[i + 1].current?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  }

  // Handle paste of full 6-digit code
  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      refs[5].current?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) { setError("Enter all 6 digits."); return; }
    setError("");
    setLoading(true);

    const { data: ok, error: rpcErr } = await supabase.rpc("verify_email_code", {
      p_email: email,
      p_code: code,
    });

    setLoading(false);
    if (rpcErr || !ok) {
      setError("Invalid or expired code. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      refs[0].current?.focus();
      return;
    }

    // Try auto-login with stored credentials
    const storedPassword = sessionStorage.getItem("ss_pending_pw");
    if (storedPassword) {
      setSigningIn(true);
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password: storedPassword,
      });
      sessionStorage.removeItem("ss_pending_pw");
      setSigningIn(false);
      if (!loginErr) {
        navigate({ to: "/" });
        return;
      }
    }

    // Fallback: show success state and let user sign in manually
    setVerified(true);
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setResending(true);
    setResent(false);
    setError("");
    try {
      await sendVerificationEmail({ data: { email } });
      setResent(true);
      setCooldown(60);
    } catch {
      setError("Failed to resend. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">No email provided.</p>
          <Link to="/login" className="mt-4 inline-block text-crimson hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-5" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{ backgroundImage: `url(${pattern})`, backgroundSize: "300px" }}
      />

      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-elegant">
          {signingIn ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-crimson" />
              <p className="text-sm font-medium text-ink">Signing you in…</p>
            </div>
          ) : verified ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">Email verified!</h2>
              <p className="text-sm text-muted-foreground">
                Your account is now active. Sign in to start buying and selling.
              </p>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-crimson px-7 py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105"
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col items-center gap-6">
              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson/10">
                <Mail className="h-7 w-7 text-crimson" />
              </div>

              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-ink">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a 6-digit code to
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{email}</p>
              </div>

              {/* 6-digit input */}
              <div className="flex gap-2" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={refs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="h-14 w-11 rounded-xl border-2 border-border bg-paper text-center text-xl font-bold text-ink outline-none transition-colors focus:border-crimson"
                  />
                ))}
              </div>

              {error && (
                <p className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || digits.join("").length !== 6}
                className="w-full rounded-full bg-crimson py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify Email"}
              </button>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="flex items-center gap-1 text-crimson hover:underline disabled:opacity-50"
                >
                  {resending ? (
                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                  ) : cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : resent ? (
                    "Sent! Resend again"
                  ) : (
                    "Resend code"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
