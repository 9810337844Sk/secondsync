import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Second Sync" },
      { name: "description", content: "Get in touch with the Second Sync team. We reply within 24 hours." },
      { property: "og:title", content: "Contact — Second Sync" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: dbError } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject,
      message,
      created_at: new Date().toISOString(),
    });
    setLoading(false);
    if (dbError) {
      setError("Failed to send. Please email us directly at teamkalpantrix@gmail.com");
    } else {
      setSent(true);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-crimson">
        Contact · सम्पर्क
      </div>
      <h1 className="mt-2 font-display text-5xl font-bold text-ink">Let's talk.</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Whether you're a seller, buyer, or just curious — namaste! We'd love to hear from you.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        {/* Contact info */}
        <div className="space-y-5">
          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-gold text-ink flex-shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-semibold text-ink">Visit us</div>
              <div className="text-sm text-muted-foreground">Maitidevi, Kathmandu, 44600, Nepal</div>
            </div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-gold text-ink flex-shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-semibold text-ink">Call / Viber</div>
              <a href="tel:+9779823457468" className="text-sm text-muted-foreground hover:text-crimson transition-colors">
                +977 982-3457468
              </a>
            </div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-gold text-ink flex-shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-semibold text-ink">Email</div>
              <a href="mailto:teamkalpantrix@gmail.com" className="text-sm text-crimson hover:underline break-all">
                teamkalpantrix@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {sent ? (
            <div className="rounded-3xl border border-crimson/30 bg-card p-10 text-center shadow-card">
              <CheckCircle2 className="mx-auto h-12 w-12 text-crimson" />
              <h2 className="mt-4 font-display text-2xl font-bold text-ink">Dhanyabad! 🙏</h2>
              <p className="mt-2 text-muted-foreground">
                Your message has been saved. We'll get back to you within 24 hours.
              </p>
              <button
                onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
                className="mt-6 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-ink hover:border-crimson"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-5 rounded-3xl border border-border bg-card p-8 shadow-card sm:grid-cols-2"
            >
              <div>
                <label className="text-sm font-semibold text-ink">Your name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Hari Bahadur"
                  className="mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-ink">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="How can we help?"
                  className="mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-ink">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  className="mt-2 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson"
                />
              </div>

              {error && (
                <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Or email us at{" "}
                  <a href="mailto:teamkalpantrix@gmail.com" className="text-crimson hover:underline">
                    teamkalpantrix@gmail.com
                  </a>
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-paper shadow-card transition-all hover:scale-[1.02] disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send message →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
