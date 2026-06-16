import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Shield,
  Sparkles,
  Truck,
  Recycle,
  Star,
  Camera,
  Bike,
  BookOpen,
  Sofa,
  Shirt,
  Gem,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Users,
  Package,
  Zap,
  Heart,
  Quote,
  ChevronRight,
  BadgeCheck,
  Banknote,
  Clock,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import hero from "@/assets/mega-love.png";
import pattern from "@/assets/pattern.jpg";
import { categories, type Product, timeAgo, formatNpr } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Second Sync — Buy & Sell Second-Hand in Nepal" },
      {
        name: "description",
        content:
          "Nepal's most-loved marketplace for pre-owned electronics, vehicles, books, fashion and antiques. Verified sellers in Kathmandu, Pokhara and beyond.",
      },
      {
        property: "og:title",
        content: "Second Sync — Buy & Sell Second-Hand in Nepal",
      },
      {
        property: "og:description",
        content: "Verified sellers · eSewa & Khalti · Safe-meet points across Nepal.",
      },
    ],
  }),
  component: Index,
});

const CAT_ICONS: Record<string, any> = {
  electronics: Camera,
  vehicles: Bike,
  books: BookOpen,
  furniture: Sofa,
  fashion: Shirt,
  antiques: Gem,
};

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    np: "प्रिया शर्मा",
    city: "Kathmandu",
    initials: "PS",
    rating: 5,
    text: "Sold my old MacBook in just 3 hours! The buyer came to a safe-meet point near Bhatbhateni. So easy and secure.",
    badge: "Verified Seller",
  },
  {
    name: "Rohan Thapa",
    np: "रोहन थापा",
    city: "Pokhara",
    initials: "RT",
    rating: 5,
    text: "Found a genuine Palpali Dhaka Topi at half the price. The photos were accurate and the seller was super helpful.",
    badge: "Happy Buyer",
  },
  {
    name: "Anita Gurung",
    np: "अनिता गुरुङ",
    city: "Lalitpur",
    initials: "AG",
    rating: 5,
    text: "I've made Rs 45,000+ selling things I no longer needed. Second Sync is genuinely life-changing for home decluttering.",
    badge: "Power Seller",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Camera,
    title: "Snap & Post",
    np: "फोटो खिच्नुहोस्",
    desc: "Take a few photos, write a quick description, and set your price. Your listing goes live in under 60 seconds — completely free.",
  },
  {
    step: "02",
    icon: MessageCircle,
    title: "Chat & Agree",
    np: "कुरा गर्नुहोस्",
    desc: "Buyers message you directly through our secure in-app chat. Negotiate, answer questions, and agree on a meetup point or delivery.",
  },
  {
    step: "03",
    icon: Banknote,
    title: "Pay Safely",
    np: "सुरक्षित भुक्तानी",
    desc: "Accept payment via eSewa, Khalti, ConnectIPS, or cash at a verified safe-meet point in your city.",
  },
  {
    step: "04",
    icon: Heart,
    title: "Build Trust",
    np: "विश्वास बढाउनुहोस्",
    desc: "Leave a review, earn badges, and grow your seller reputation. The more you trade, the more the community trusts you.",
  },
];

function Index() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recent, setRecent]     = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("listings")
      .select("*")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        const rows = (data as Product[]) ?? [];
        setFeatured(rows.slice(0, 6));
        setRecent(rows.slice(0, 3));
      });
  }, []);

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3d0010 0%, #5c0018 50%, #7a1228 100%)", minHeight: "100vh" }}
      >
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: `url(${pattern})`, backgroundSize: "350px" }}
        />

        {/* Ambient glow top-left */}
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #d4a857 0%, transparent 65%)", filter: "blur(60px)" }} />
        {/* Ambient glow bottom-right */}
        <div className="absolute -bottom-40 right-20 h-[400px] w-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #d4a857 0%, transparent 65%)", filter: "blur(80px)" }} />

        {/* ── Desktop layout ── */}
        <div className="relative hidden min-h-[100vh] lg:grid" style={{ gridTemplateColumns: "1fr 1fr" }}>

          {/* LEFT — text */}
          <div className="flex flex-col justify-center px-12 py-16 xl:px-20">
            <div className="animate-float-in" style={{ maxWidth: "520px" }}>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-paper/90 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-gold" />
                Nepal's #1 second-hand marketplace
              </div>

              <h1 className="font-display text-[4.5rem] font-bold leading-[1.0] xl:text-[5.5rem]" style={{ color: "#f5f0e8" }}>
                Buy smart.<br />
                Sell easy.<br />
                <span style={{ color: "#d4a857" }}>Live circular.</span>
              </h1>

              <p className="mt-4 text-base italic" style={{ color: "rgba(245,240,232,0.7)", fontFamily: '"Tiro Devanagari Sanskrit", serif' }}>
                किन्नुहोस्, बेच्नुहोस्, पुन: प्रयोग गर्नुहोस् — एकै ठाउँमा।
              </p>

              <p className="mt-4 text-base leading-relaxed" style={{ color: "rgba(245,240,232,0.72)", maxWidth: "420px" }}>
                In Kathmandu, trust Second Sync to give your belongings a second life — at fair prices, safe meet-up points, and eSewa-easy payments.
              </p>

              <div className="mt-8 flex gap-3">
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-ink shadow-lg transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #d4a857, #b8872a)" }}
                >
                  Start Browsing <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/sell"
                  className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/10"
                  style={{ borderColor: "rgba(255,255,255,0.25)", color: "#f5f0e8" }}
                >
                  Post Your Item
                </Link>
              </div>

              {/* Stats row */}
              <div className="mt-10 flex gap-8 border-t pt-8" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                {[
                  { n: "10+",  l: "Listings",      s: "Active" },
                  { n: "10+",  l: "Sellers",        s: "Verified" },
                  { n: "10★",  l: "Reviews",        s: "Real buyers" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="font-display text-2xl font-bold" style={{ color: "#d4a857" }}>{s.n}</div>
                    <div className="text-sm font-semibold" style={{ color: "#f5f0e8" }}>{s.l}</div>
                    <div className="text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>{s.s}</div>
                  </div>
                ))}
              </div>

              {/* Nepal tag */}
              <div className="mt-8 inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-lg">🇳🇵</span>
                <span className="text-sm font-semibold" style={{ color: "#f5f0e8" }}>Made in Nepal</span>
                <span className="text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>· For Nepali buyers & sellers</span>
              </div>
            </div>
          </div>

          {/* RIGHT — full image */}
          <div className="relative flex items-end justify-center overflow-hidden">
            {/* Gold ring glow behind figure */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-[480px] w-[480px] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(212,168,87,0.18) 0%, transparent 65%)", filter: "blur(30px)" }} />
            </div>

            <img
              src={hero}
              alt="Second Sync shopping"
              className="relative z-10 h-full w-full object-cover object-bottom"
              style={{
                filter: "drop-shadow(-8px 0 40px rgba(60,0,12,0.9)) drop-shadow(0 -4px 30px rgba(212,168,87,0.2))",
                animation: "bob 5s ease-in-out infinite",
              }}
            />

            {/* Left fade into background */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24"
              style={{ background: "linear-gradient(to right, #3d0010 0%, transparent 100%)" }} />
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="relative flex flex-col items-center px-6 pb-10 pt-12 text-center lg:hidden">
          <div className="animate-float-in">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold" style={{ color: "#f5f0e8" }}>
              <Sparkles className="h-3 w-3" style={{ color: "#d4a857" }} /> Nepal's #1 marketplace
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight" style={{ color: "#f5f0e8" }}>
              Buy smart.<br />Sell easy.<br />
              <span style={{ color: "#d4a857" }}>Live circular.</span>
            </h1>
            <p className="mt-3 text-sm italic" style={{ color: "rgba(245,240,232,0.7)", fontFamily: '"Tiro Devanagari Sanskrit", serif' }}>
              किन्नुहोस्, बेच्नुहोस्, पुन: प्रयोग गर्नुहोस्
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(245,240,232,0.7)" }}>
              In Kathmandu, trust Second Sync for fair prices and safe trading.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/browse" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-ink" style={{ background: "linear-gradient(135deg, #d4a857, #b8872a)" }}>
                Browse <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/sell" className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold" style={{ borderColor: "rgba(255,255,255,0.25)", color: "#f5f0e8" }}>
                Sell
              </Link>
            </div>
          </div>
          <img
            src={hero}
            alt="Second Sync"
            className="mt-6 h-[320px] w-full max-w-none rounded-3xl object-cover"
            style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))", animation: "bob 5s ease-in-out infinite" }}
          />
        </div>

        <div className="h-1 nepali-divider" />
      </section>

      {/* ─── TICKER ───────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-b border-border bg-ink py-3.5 text-paper">
        <div className="flex animate-ticker gap-12 whitespace-nowrap text-xs uppercase tracking-[0.2em] text-paper/70">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12">
              <span>★ Verified sellers</span>
              <span>·</span>
              <span>eSewa · Khalti · ConnectIPS</span>
              <span>·</span>
              <span>Safe-meet points in 12 cities</span>
              <span>·</span>
              <span>Free listing, always</span>
              <span>·</span>
              <span>नेपालको आफ्नै बजार</span>
              <span>·</span>
              <span>120+ tons saved from landfill</span>
              <span>·</span>
              <span>Pathao delivery available</span>
              <span>·</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── IMPACT STATS BANNER ─────────────────────────────────────── */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { icon: Package, value: "10+", label: "Active Listings", np: "सक्रिय सूचीहरू" },
              { icon: Users, value: "10+", label: "Verified Sellers", np: "प्रमाणित विक्रेता" },
              { icon: TrendingUp, value: "Rs 10,000", label: "Traded Monthly", np: "मासिक व्यापार" },
              { icon: Recycle, value: "10g", label: "Kept from Landfill", np: "फोहोर बचाइयो" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-gold text-ink">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="font-display text-2xl font-bold text-ink sm:text-3xl">{s.value}</div>
                <div className="text-sm font-medium text-ink/80">{s.label}</div>
                <div
                  className="text-xs text-muted-foreground"
                  style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
                >
                  {s.np}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Categories · वर्गहरू"
          title="Find what you love"
          subtitle="From valley electronics to mountain bikes — shop by category."
        />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories
            .filter((c) => c.slug !== "all")
            .map((c) => {
              const Icon = CAT_ICONS[c.slug] ?? Sparkles;
              return (
                <Link
                  key={c.slug}
                  to="/browse"
                  search={{ cat: c.slug } as any}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-card transition-all hover:-translate-y-1.5 hover:border-crimson hover:shadow-elegant"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-crimson transition-colors group-hover:bg-crimson group-hover:text-paper">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold text-ink">{c.name}</div>
                    <div
                      className="text-xs text-muted-foreground"
                      style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
                    >
                      {c.np}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    Browse →
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ────────────────────────────────────────── */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              eyebrow="Featured · विशेष"
              title="Hand-picked this week"
              subtitle="The freshest listings from sellers across the country."
            />
            <Link to="/browse" className="text-sm font-semibold text-crimson hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.length > 0
              ? featured.map((p) => <ProductCard key={p.id} p={p} compact />)
              : <p className="col-span-4 py-10 text-center text-muted-foreground">No listings yet — <Link to="/sell" className="text-crimson hover:underline">be the first to post</Link>.</p>
            }
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How It Works · कसरी काम गर्छ"
          title="Trading made simple"
          subtitle="From snap to sale in four easy steps. No fees. No hassle."
        />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} className="relative">
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="absolute right-0 top-6 hidden h-0.5 w-full translate-x-1/2 bg-border lg:block" />
              )}
              <div className="relative z-10 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold text-ink">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-4xl font-bold text-border">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{step.title}</h3>
                  <p
                    className="mt-0.5 text-xs text-crimson"
                    style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
                  >
                    {step.np}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TRUST / WHY ──────────────────────────────────────────────── */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Why Second Sync · किन Second Sync"
            title="Trust, built the Nepali way"
            subtitle="Everything we've built is designed around safety and community."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                i: Shield,
                t: "ID Verification",
                np: "परिचय प्रमाणीकरण",
                d: "Full ID verification via citizenship & OTP is coming soon. Every seller will be blue-tick verified.",
                badge: "Coming Soon",
              },
              {
                i: Truck,
                t: "Pathao Delivery",
                np: "डेलिभरी",
                d: "Doorstep delivery across the valley and beyond, powered by Pathao logistics.",
              },
              {
                i: Recycle,
                t: "Circular by Design",
                np: "पुन: प्रयोग",
                d: "We've helped keep 120+ tons of goods out of Nepal's landfills since launch.",
              },
              {
                i: BadgeCheck,
                t: "5-Star Community",
                np: "समुदाय",
                d: "Real ratings from real Nepali buyers and sellers. Every review is verified.",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-gold hover:shadow-elegant"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold text-ink transition-transform group-hover:scale-110">
                    <f.i className="h-5 w-5" />
                  </div>
                  {"badge" in f && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      {(f as any).badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{f.t}</h3>
                <p
                  className="mt-0.5 text-xs text-crimson"
                  style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
                >
                  {f.np}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Community Stories · समुदायका कथाहरू"
          title="Loved by Nepalis"
          subtitle="Real stories from real buyers and sellers across the country."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 shadow-card"
            >
              <Quote className="h-8 w-8 text-gold/40" />
              <p className="text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-display text-sm font-bold text-ink">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{t.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {t.city}
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-crimson/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-crimson">
                  {t.badge}
                </span>
              </div>
              <div className="absolute right-7 top-7 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RECENT LISTINGS PREVIEW ──────────────────────────────────── */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              eyebrow="Just Listed · भर्खर पोस्ट"
              title="Hot off the press"
              subtitle="These just went live — grab them before someone else does."
            />
            <Link to="/browse" className="text-sm font-semibold text-crimson hover:underline">
              See all new listings →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {recent.length > 0 ? recent.map((item) => (
              <Link
                key={item.id}
                to="/product/$id"
                params={{ id: item.id }}
                className="group flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <img
                  src={item.images?.[0] ?? "/placeholder.jpg"}
                  alt={item.title}
                  className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="flex flex-col justify-between gap-1">
                  <div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-crimson">
                      {item.category}
                    </span>
                    <h3 className="mt-1 font-display text-sm font-semibold text-ink leading-snug group-hover:text-crimson transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <div>
                    <div className="font-display text-base font-bold text-crimson">Rs {formatNpr(item.price)}</div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {item.location}
                      <span className="mx-1">·</span>
                      <Clock className="h-3 w-3" /> {timeAgo(item.posted_at)}
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <p className="col-span-3 py-8 text-center text-muted-foreground">
                No listings yet. <Link to="/sell" className="text-crimson hover:underline">Post the first one →</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── PAYMENT PARTNERS ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Accepted payment methods
            </p>
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Coming Soon
            </span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
            {/* eSewa */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
              <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              <span className="font-display text-sm font-semibold text-ink">eSewa</span>
            </div>
            {/* Khalti — updated logo */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
              <img src="https://khaltibyime.khalti.com/wp-content/uploads/2025/07/cropped-Logo-for-Blog-1024x522.png" alt="Khalti" className="h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              <span className="font-display text-sm font-semibold text-ink">Khalti</span>
            </div>
            {/* ConnectIPS — updated logo */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
              <img src="https://login.connectips.com/static/media/newLogo.ed7f73c800e12259be50.png" alt="ConnectIPS" className="h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              <span className="font-display text-sm font-semibold text-ink">ConnectIPS</span>
            </div>
            {/* Cash */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
              <img src="https://png.pngtree.com/png-clipart/20221230/original/pngtree-1000-nepalese-rupee-stack-pile-png-image_8831946.png" alt="Cash" className="h-7 object-contain" />
              <span className="font-display text-sm font-semibold text-ink">Cash</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SELL PROMO CTA ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-paper shadow-elegant sm:p-16">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: `url(${pattern})`, backgroundSize: "320px" }}
          />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-crimson/30 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/10 px-3 py-1 text-xs font-medium text-paper/80 backdrop-blur">
                <Zap className="h-3.5 w-3.5 text-gold" /> Sell in 60 seconds
              </div>
              <h2 className="mt-4 font-display text-4xl font-bold text-balance sm:text-5xl">
                Got something gathering dust?{" "}
                <span className="text-gold">Turn it into cash.</span>
              </h2>
              <p className="mt-4 text-base text-paper/80">
                Post in 60 seconds. We'll show it to thousands of buyers across Nepal — no listing
                fees, ever. No commission. Just your stuff finding a new home.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/sell"
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-ink shadow-card transition-all hover:scale-105 hover:shadow-elegant"
                >
                  Post your first item <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-7 py-3.5 text-sm font-semibold text-paper backdrop-blur transition-colors hover:bg-paper/15"
                >
                  Learn more
                </Link>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: CheckCircle2, title: "Free to list", desc: "No fees, no commission, ever." },
                { icon: Clock, title: "60-second posting", desc: "Go live faster than a cup of chiya." },
                { icon: PhoneCall, title: "Direct messages", desc: "Chat securely with buyers." },
                { icon: BadgeCheck, title: "Seller badge", desc: "Build trust, earn more." },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-paper/15 bg-paper/10 p-5 backdrop-blur"
                >
                  <card.icon className="h-5 w-5 text-gold" />
                  <div className="mt-2 font-display text-sm font-semibold text-paper">
                    {card.title}
                  </div>
                  <div className="mt-1 text-xs text-paper/70">{card.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function Stat({ n, label, sub }: { n: string; label: string; sub?: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold text-paper">{n}</div>
      <div className="text-xs uppercase tracking-wider text-paper/60">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] text-paper/40">{sub}</div>}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-crimson">{eyebrow}</div>
      <h2 className="mt-3 font-display text-4xl font-bold text-ink text-balance sm:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
