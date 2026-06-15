import { createFileRoute, Link } from "@tanstack/react-router";
import { Recycle, Mountain, HandHeart } from "lucide-react";
import pattern from "@/assets/pattern.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Second Sync" },
      { name: "description", content: "Second Sync is Nepal's circular marketplace, built by Nepalis for Nepalis. Learn our story and mission." },
      { property: "og:title", content: "About — Second Sync" },
      { property: "og:description", content: "Nepal's circular marketplace, built by Nepalis." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-hero py-24 text-paper">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${pattern})`, backgroundSize: "320px" }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">हाम्रो कथा · Our Story</div>
          <h1 className="mt-3 font-display text-5xl font-bold sm:text-6xl">
            Built in the valley, <span className="text-gold">for all of Nepal.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-paper/80">
            Second Sync started in a Patan cafe with one question: why must Nepalis throw away things that still have life?
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="font-display text-2xl leading-relaxed text-ink">
          We grew up watching our parents hand down books, bikes, and brass to younger cousins. Reuse wasn't a movement — it was just how we lived. Second Sync brings that culture online, with the trust, payments, and delivery a modern Nepal expects.
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { i: Recycle, t: "Circular", d: "120+ tons kept out of landfill in our first year." },
            { i: Mountain, t: "Nepali", d: "Built in Kathmandu. Every payout in NPR." },
            { i: HandHeart, t: "Trusted", d: "Real ID verification. Real safe-meet points." },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold text-ink">
                <v.i className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{v.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <h2 className="font-display text-3xl font-bold text-ink">Want to know the team?</h2>
          <p className="mt-2 text-muted-foreground">Meet the four Nepalis behind Second Sync.</p>
          <Link to="/team" className="mt-6 inline-flex rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-paper">Meet the team →</Link>
        </div>
      </section>
    </div>
  );
}