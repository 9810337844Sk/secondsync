import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import pattern from "@/assets/pattern.jpg";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — Second Sync" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetErr) {
      setError("Could not send reset email. Check the address and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-5" />
      <div className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{ backgroundImage: `url(${pattern})`, backgroundSize: "300px" }} />

      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-crimson transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-elegant">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">Check your email</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                We sent a password reset link to <strong className="text-ink">{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn't receive it? Check your spam folder or{" "}
                <button onClick={() => setSent(false)} className="text-crimson hover:underline">try again</button>.
              </p>
              <Link to="/login"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-crimson px-7 py-3 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson/10 mb-5">
                <Mail className="h-7 w-7 text-crimson" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">Forgot password?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your registered email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-ink">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson"
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
                )}

                <button type="submit" disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-full bg-crimson px-6 py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
