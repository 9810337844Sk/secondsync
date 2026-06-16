import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Our Team — Second Sync" },
      { name: "description", content: "Meet the Nepali founding team behind Second Sync." },
      { property: "og:title", content: "Our Team — Second Sync" },
    ],
  }),
  component: Team,
});

const team = [
  {
    name: "Mega Paudel",
    role: "Backend",
    np: "ब्याकएन्ड",
    bio: "Architect of the core platform — APIs, databases and the infrastructure that keeps Second Sync running.",
    photo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgiFphIFHCK5Hv9tGw-DUTLQZEkCRSapTvOlwUe3l12lkC_pRI_R009NDHx5fLs4GNdbsp75a-baUBafBYLBT5uHAYhcH8IaK7uXa0r2kvm0at-jOoFbofU2brn995wFpZkMcjs-i88IYrdHsLUcoswZbgeR3SHPjy-8P0gU2o29nnnb4tpDSeJGwgKQec/s1600/WhatsApp%20Image%202026-06-15%20at%2010.51.59%20PM.jpeg",
    color: "from-rose-500 to-amber-500",
  },
  {
    name: "Rahul Shah",
    role: "Frontend",
    np: "फ्रन्टएन्ड",
    bio: "Crafts fast, beautiful interfaces — from listing pages to checkout flows.",
    photo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiNd4zn6g1hlWHoiGMDIR_Dk3OTv2PsDbu2iM0QiYumCFGi8f-lMqSaoNOQHb1vgOMShAfN06rcKXCyz-0NShgUEuFVQgEQyP1QRg4VM3ZoJjuKMnXv-vYn6hCHylCCjOYVVoxlFR67LMAlv8mYv4JYb52kAG7LYaFqv_VJRc6bNytlMCVyQID8bemRAaA/s1600/WhatsApp%20Image%202026-06-15%20at%2010.51.59%20PM%20%282%29.jpeg",
    color: "from-amber-500 to-yellow-400",
  },
  {
    name: "Dilasha Basnet",
    role: "UI/UX Design & Frontend",
    np: "डिजाइन र फ्रन्टएन्ड",
    bio: "Shapes every pixel of Second Sync — design systems, user flows and React components.",
    photo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhF53KsIIJr68cC-tRB2NBO4JUNNfUlpZFOh4Sqf2mQs2uYx_oXudiKUt7Ca-sUBo2TU7H72OgTojUh6AafbY85Dq0fQ3IwMIoICtFMNVB5jYH-x-VYGA1MlDKcqAaQLgDkQXr1mMhhdx29AdrcEBkIinNc1n_yyAY0UeqbbD2o18kYwJ4_fCjJPyVjVBs/s1600/WhatsApp%20Image%202026-06-15%20at%2010.51.59%20PM%20%281%29.jpeg",
    color: "from-rose-600 to-pink-400",
  },
  {
    name: "Swoyam Rajkarnikar",
    role: "Backend",
    np: "ब्याकएन्ड",
    bio: "Builds the server logic, integrations and data pipelines that power the marketplace.",
    photo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgj6_kYIScWbAufg5hkAKJiZqrmW9FA_IjDnYLcp_OvMsa80OwilHvp8oQ89xzllUyDqVImwHbXvHeETZhS8ZP92ZP5eupmmuVbp42ESM8ta3WaR2jkn7hGCzLqj_-saovWvkQkQb_zKxjQ4Fok1rFxsItM0o9wLrdxV_WomGW7SFQnBIZhdrLo7_QP5F0/s1600/WhatsApp%20Image%202026-06-15%20at%2010.51.58%20PM.jpeg",
    color: "from-blue-500 to-indigo-500",
  },
  {
    name: "Swarup Ghorsaine",
    role: "AI Integration",
    np: "एआई इन्टिग्रेसन",
    bio: "Brings intelligent features to life — smart search, recommendations and automation.",
    photo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdqzwSHkhDLPncoNOZ6X24Cyvs510jH5-ZWYzSmFlchgfrrR4c4EgZZK9U8q3BoQ-Tpr8De6wCepxITO9cm3cdqpejqCXKEkwlosqHcQpLCmenrXYJQR7EXab_xEtwJN8p4X2Pek-FBG6rnMAbcCv-oaIGI3ZaKmhiM3hvJ52HHfJeBZNLQ_VNW_7cHps/s1600/WhatsApp%20Image%202026-06-15%20at%2010.51.58%20PM%20%281%29.jpeg",
    color: "from-orange-500 to-rose-500",
  },
];

function Team() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero py-20 text-paper">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Our Team · हाम्रो टोली
          </div>
          <h1 className="mt-3 font-display text-5xl font-bold text-balance sm:text-6xl">
            Five Nepalis. <span className="text-gold">One big idea.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-paper/80">
            Born and raised in the valley, building a marketplace that finally feels like ours.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {team.map((m) => (
            <article
              key={m.name}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all hover:-translate-y-2 hover:shadow-elegant"
            >
              {/* Photo */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={m.photo}
                  alt={m.name}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                    el.parentElement!.classList.add(`bg-gradient-to-br`, m.color);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-paper/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                  🇳🇵 {m.np}
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-ink">{m.name}</h3>
                <p className="mt-1 text-sm font-semibold text-crimson">{m.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Hiring CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <h2 className="font-display text-3xl font-bold text-ink">
            We're hiring across Kathmandu
          </h2>
          <p className="mt-3 text-muted-foreground">
            Engineers, operations, and customer-love — come build with us.
          </p>
          <a
            href="mailto:teamkalpantrix@gmail.com"
            className="mt-6 inline-flex rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-paper transition-transform hover:scale-105"
          >
            teamkalpantrix@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
}
