import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { sendVerificationEmail } from "@/lib/send-verification";
import { registerUser } from "@/lib/register-user";
import pattern from "@/assets/pattern.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Second Sync" },
      { name: "description", content: "Sign in or create your Second Sync account to buy and sell across Nepal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  if (loading || user) return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-5" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{ backgroundImage: `url(${pattern})`, backgroundSize: "300px" }}
      />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> Nepal's #1 second-hand marketplace
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold text-ink">
            {tab === "login" ? "Welcome back" : "Join Second Sync"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "login"
              ? "Sign in to buy, sell and manage your listings."
              : "Create your free account and start trading today."}
          </p>
        </div>

        <div className="mb-6 flex rounded-2xl border border-border bg-card p-1 shadow-card">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${tab === "login" ? "bg-crimson text-paper shadow-sm" : "text-muted-foreground hover:text-ink"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${tab === "signup" ? "bg-crimson text-paper shadow-sm" : "text-muted-foreground hover:text-ink"}`}
          >
            Create Account
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-elegant">
          {tab === "login" ? <LoginForm /> : <SignupForm onSuccess={() => setTab("login")} />}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/about" className="text-crimson hover:underline">terms & community guidelines</Link>.
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });

    if (signInErr) {
      setLoading(false);
      console.error("Supabase signIn error:", signInErr);
      const msg = (signInErr.message ?? "").toLowerCase();
      const name = (signInErr.name ?? "").toLowerCase();

      if (name.includes("retryable") || name.includes("fetch") || msg === "" || typeof signInErr.message === "object") {
        setError("Account setup is incomplete. Please register again or contact support.");
        return;
      }
      if (msg.includes("not confirmed") || msg.includes("email not confirmed")) {
        try { await sendVerificationEmail({ data: { email } }); } catch {}
        sessionStorage.setItem("ss_pending_pw", password);
        navigate({ to: "/verify", search: { email } });
        return;
      }
      if (msg.includes("invalid login credentials") || msg.includes("invalid email") || msg.includes("invalid password") || msg.includes("email not found") || msg.includes("wrong password")) {
        setError("Wrong email or password. Please try again.");
        return;
      }
      setError(typeof signInErr.message === "string" && signInErr.message ? signInErr.message : "Login failed. Please try again.");
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("is_verified").eq("id", data.user.id).single();
      if (profile && !profile.is_verified) {
        await supabase.auth.signOut();
        setLoading(false);
        try { await sendVerificationEmail({ data: { email } }); } catch {}
        sessionStorage.setItem("ss_pending_pw", password);
        navigate({ to: "/verify", search: { email } });
        return;
      }
    }

    setLoading(false);
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <InputField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-ink">Password</label>
          <Link to="/forgot-password" className="text-xs text-crimson hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-2">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-xl border border-border bg-paper px-4 py-3 pr-11 text-sm outline-none focus:border-crimson"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-crimson px-6 py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60">
        {loading ? "Signing in…" : <>Sign In <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

// ─── Password strength checker ────────────────────────────────
function checkPassword(pw: string) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = checkPassword(password);
  const passed = Object.values(checks).filter(Boolean).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[0,1,2,3,4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < passed ? colors[passed - 1] : "bg-border"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${passed < 3 ? "text-red-500" : passed < 5 ? "text-yellow-600" : "text-green-600"}`}>
        {labels[passed - 1] ?? "Too weak"}
      </p>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {[
          { key: "length",  label: "8+ characters" },
          { key: "upper",   label: "Uppercase letter" },
          { key: "lower",   label: "Lowercase letter" },
          { key: "number",  label: "Number" },
          { key: "special", label: "Special character (!@#…)" },
        ].map(({ key, label }) => (
          <div key={key} className={`flex items-center gap-1 text-xs ${checks[key as keyof typeof checks] ? "text-green-600" : "text-muted-foreground"}`}>
            {checks[key as keyof typeof checks]
              ? <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
              : <X className="h-3 w-3 flex-shrink-0" />}
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Only allow digits in phone field
  function handlePhone(val: string) {
    // Strip everything that isn't a digit or leading +
    const cleaned = val.replace(/[^\d]/g, "").slice(0, 15);
    setPhone(cleaned);
  }

  function validatePassword(pw: string): string | null {
    const c = checkPassword(pw);
    if (!c.length)  return "Password must be at least 8 characters.";
    if (!c.upper)   return "Password must contain at least one uppercase letter.";
    if (!c.lower)   return "Password must contain at least one lowercase letter.";
    if (!c.number)  return "Password must contain at least one number.";
    if (!c.special) return "Password must contain at least one special character (!@#$…).";
    return null;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!phone) { setError("Mobile phone number is required."); return; }
    if (phone.length < 7 || phone.length > 15) { setError("Enter a valid phone number (7–15 digits)."); return; }

    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    setLoading(true);
    let result: { ok: boolean; error?: string } = { ok: false };
    try {
      result = await registerUser({ data: { email, password, full_name: fullName, phone } });
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    sessionStorage.setItem("ss_pending_pw", password);
    navigate({ to: "/verify", search: { email } });
  }

  const pwChecks = checkPassword(password);
  const pwValid  = Object.values(pwChecks).every(Boolean);

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-4">
      <InputField label="Full name" type="text" value={fullName} onChange={setFullName} placeholder="Hari Bahadur Thapa" required />
      <InputField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />

      {/* Phone — digits only */}
      <div>
        <label className="text-sm font-semibold text-ink">
          Mobile number <span className="font-normal text-muted-foreground">(digits only)</span>
        </label>
        <div className="relative mt-2 flex">
          <span className="flex items-center rounded-l-xl border border-r-0 border-border bg-secondary px-3 text-sm font-medium text-ink">
            +977
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => handlePhone(e.target.value)}
            placeholder="98XXXXXXXX"
            required
            maxLength={15}
            className="flex-1 rounded-r-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        {phone && (phone.length < 7 || phone.length > 15) && (
          <p className="mt-1 text-xs text-red-500">Enter 7–15 digits.</p>
        )}
      </div>

      {/* Password with strength meter */}
      <div>
        <label className="text-sm font-semibold text-ink">Password</label>
        <div className="relative mt-2">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            className={`w-full rounded-xl border bg-paper px-4 py-3 pr-11 text-sm outline-none transition-colors ${
              password && !pwValid ? "border-red-300 focus:border-red-400" : "border-border focus:border-crimson"
            }`}
          />
          <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-ink">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrengthBar password={password} />
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl bg-secondary/60 px-4 py-3">
        {["Free to list forever", "Khalti-secured checkout", "Verified buyer protection"].map((p) => (
          <div key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-crimson" /> {p}
          </div>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !pwValid}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-crimson px-6 py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60"
      >
        {loading ? "Creating account…" : <>Create free account <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

function InputField({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void; [k: string]: any }) {
  return (
    <div>
      <label className="text-sm font-semibold text-ink">{label}</label>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson"
      />
    </div>
  );
}
