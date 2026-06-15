import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");

  if (user) {
    navigate({ to: "/" });
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-5" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{ backgroundImage: `url(${pattern})`, backgroundSize: "300px" }}
      />

      <div className="w-full max-w-md">
        {/* Logo / header */}
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

        {/* Tab switcher */}
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate({ to: "/" });
    }
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <InputField
        label="Email address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        required
      />
      <div>
        <label className="text-sm font-semibold text-ink">Password</label>
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
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-crimson px-6 py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60"
      >
        {loading ? "Signing in…" : <>Sign In <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("Mobile phone is required.");
      return;
    }
    const phoneValue = phone.trim();
    if (!/^\+?[0-9\s\-()]{7,20}$/.test(phoneValue)) {
      setError("Enter a valid phone number.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phoneValue } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Insert profile row
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone: phoneValue,
        is_banned: false,
        is_admin: false,
      });
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-4">
        <CheckCircle2 className="h-14 w-14 text-crimson" />
        <h2 className="font-display text-2xl font-bold text-ink">Account created!</h2>
        <p className="text-sm text-muted-foreground">
          Check your email to confirm your account, then sign in.
        </p>
        <button
          onClick={onSuccess}
          className="mt-2 rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-paper"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-4">
      <InputField
        label="Full name"
        type="text"
        value={fullName}
        onChange={setFullName}
        placeholder="Hari Bahadur Thapa"
        required
      />
      <InputField
        label="Email address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        required
      />
      <InputField
        label="Mobile phone"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={setPhone}
        placeholder="+977 98xxxxxxxx"
        required
      />
      <div>
        <label className="text-sm font-semibold text-ink">Password</label>
        <div className="relative mt-2">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            className="w-full rounded-xl border border-border bg-paper px-4 py-3 pr-11 text-sm outline-none focus:border-crimson"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Perks */}
      <div className="flex flex-col gap-1.5 rounded-xl bg-secondary/60 px-4 py-3">
        {["Free to list forever", "eSewa & Khalti payouts", "Verified buyer protection"].map((p) => (
          <div key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-crimson" /> {p}
          </div>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-crimson px-6 py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60"
      >
        {loading ? "Creating account…" : <>Create free account <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

function InputField({
  label, value, onChange, ...rest
}: { label: string; value: string; onChange: (v: string) => void; [k: string]: any }) {
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
