import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, CheckCircle2, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import pattern from "@/assets/pattern.jpg";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Second Sync" }] }),
  component: ResetPasswordPage,
});

function checkPassword(pw: string) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [show, setShow]           = useState(false);
  const [showC, setShowC]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");
  const [ready, setReady]         = useState(false);

  // Supabase sends the session via URL hash — onAuthStateChange picks it up
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checks = checkPassword(password);
  const pwValid = Object.values(checks).every(Boolean);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!pwValid) { setError("Password does not meet requirements."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateErr) { setError(updateErr.message || "Could not update password. Please try again."); return; }
    setDone(true);
    setTimeout(() => navigate({ to: "/" }), 3000);
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-crimson mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-5" />
      <div className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{ backgroundImage: `url(${pattern})`, backgroundSize: "300px" }} />

      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-elegant">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">Password updated!</h2>
              <p className="text-sm text-muted-foreground">Redirecting you to your account…</p>
            </div>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson/10 mb-5">
                <KeyRound className="h-7 w-7 text-crimson" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">Set new password</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>

              <form onSubmit={handleReset} className="mt-6 flex flex-col gap-4">
                {/* New password */}
                <div>
                  <label className="text-sm font-semibold text-ink">New password</label>
                  <div className="relative mt-2">
                    <input type={show ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required
                      className={`w-full rounded-xl border bg-paper px-4 py-3 pr-11 text-sm outline-none transition-colors ${password && !pwValid ? "border-red-300 focus:border-red-400" : "border-border focus:border-crimson"}`} />
                    <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-ink transition-colors">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[0,1,2,3,4].map(i => {
                          const passed = Object.values(checks).filter(Boolean).length;
                          const colors = ["bg-red-400","bg-orange-400","bg-yellow-400","bg-blue-400","bg-green-500"];
                          return <div key={i} className={`h-1.5 flex-1 rounded-full ${i < passed ? colors[passed-1] : "bg-border"}`} />;
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {[
                          { k: "length",  l: "8+ characters" },
                          { k: "upper",   l: "Uppercase letter" },
                          { k: "lower",   l: "Lowercase letter" },
                          { k: "number",  l: "Number" },
                          { k: "special", l: "Special character" },
                        ].map(({ k, l }) => (
                          <div key={k} className={`flex items-center gap-1 text-xs ${checks[k as keyof typeof checks] ? "text-green-600" : "text-muted-foreground"}`}>
                            {checks[k as keyof typeof checks] ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />} {l}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="text-sm font-semibold text-ink">Confirm password</label>
                  <div className="relative mt-2">
                    <input type={showC ? "text" : "password"} value={confirm}
                      onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" required
                      className={`w-full rounded-xl border bg-paper px-4 py-3 pr-11 text-sm outline-none transition-colors ${confirm && confirm !== password ? "border-red-300 focus:border-red-400" : "border-border focus:border-crimson"}`} />
                    <button type="button" tabIndex={-1} onClick={() => setShowC(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-ink transition-colors">
                      {showC ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

                <button type="submit" disabled={loading || !pwValid || password !== confirm}
                  className="flex items-center justify-center gap-2 rounded-full bg-crimson px-6 py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
