import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Shield, Sparkles, Truck, Recycle, Star, Camera, Smartphone,
  Bike, BookOpen, Sofa, Shirt, Gem, Dumbbell, CheckCircle2, MapPin,
  TrendingUp, Package, Zap, Heart, Quote, BadgeCheck, Banknote,
  Clock, PhoneCall, MessageCircle, ChevronRight,
} from "lucide-react";
import hero from "../../hero/hero-left-mega.png";
import khaltiPng from "../../hero/khalti.png";
import pathaoPng from "../../hero/pathao.png";
import heroImg from "../../favicon/hero.png";
import pattern from "@/assets/pattern.jpg";
import { categories, type Product, timeAgo, formatNpr } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SecondSync — Kathmandu Valley's Second-Hand Marketplace" },
      {
        name: "description",
        content:
          "Buy and sell second-hand goods across Kathmandu, Lalitpur, and Bhaktapur. Verified sellers, Khalti payments, Pathao delivery.",
      },
      { property: "og:title", content: "SecondSync — Buy & Sell in the Kathmandu Valley" },
      {
        property: "og:description",
        content: "Valley-first second-hand marketplace. Verified sellers · Khalti · Pathao delivery.",
      },
    ],
  }),
  component: Index,
});

const CAT_ICONS: Record<string, any> = {
  electronics: Camera,
  mobiles:     Smartphone,
  vehicles:    Bike,
  fashion:     Shirt,
  furniture:   Sofa,
  books:       BookOpen,
  sports:      Dumbbell,
  antiques:    Gem,
};

const CAT_COLORS: Record<string, string> = {
  electronics: "#1a3a5c",
  mobiles:     "#1a3a4f",
  vehicles:    "#4a2000",
  fashion:     "#4a0030",
  furniture:   "#2a4a00",
  books:       "#4a3a00",
  sports:      "#004a20",
  antiques:    "#4a1a00",
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
    name: "Anita Gurung",
    np: "अनिता गुरुङ",
    city: "Lalitpur",
    initials: "AG",
    rating: 5,
    text: "I've made Rs 45,000+ selling things I no longer needed. SecondSync is genuinely life-changing for home decluttering.",
    badge: "Power Seller",
  },
  {
    name: "Rajan Shakya",
    np: "राजन शाक्य",
    city: "Bhaktapur",
    initials: "RS",
    rating: 5,
    text: "Found a nearly-new electric scooter at half the price. Payment was smooth via Khalti and Pathao delivered it same day!",
    badge: "Happy Buyer",
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
    desc: "Buyers connect with you directly. Negotiate, answer questions, and agree on a meetup point or Pathao delivery across the valley.",
  },
  {
    step: "03",
    icon: Banknote,
    title: "Pay Safely",
    np: "सुरक्षित भुक्तानी",
    desc: "Pay securely via Khalti — or settle in cash at a verified safe-meet point in Kathmandu, Lalitpur, or Bhaktapur.",
  },
  {
    step: "04",
    icon: Heart,
    title: "Build Trust",
    np: "विश्वास बढाउनुहोस्",
    desc: "Leave a review, earn badges, and grow your seller reputation. The more you trade, the more the valley trusts you.",
  },
];

const VALLEY_DISTRICTS = [
  {
    name: "Kathmandu",
    np: "काठमाडौं",
    desc: "The central hub — Thamel, Maharajgunj, Baneshwor, New Road, Bouddha, Chabahil.",
    emoji: "🏙️",
    color: "#5c0018",
  },
  {
    name: "Lalitpur",
    np: "ललितपुर",
    desc: "Patan's historic market — Mangalbazar, Pulchowk, Jwalakhel, Sanepa, Ekantakuna.",
    emoji: "🏛️",
    color: "#1a3a5c",
  },
  {
    name: "Bhaktapur",
    np: "भक्तपुर",
    desc: "Authentic valley trades — Suryabinayak, Sallaghari, Katunje, Dudhpati.",
    emoji: "🏰",
    color: "#2a4a00",
  },
];

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function Index() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recent, setRecent]     = useState<Product[]>([]);

  const [statsRef,  statsVis]  = useInView();
  const [catsRef,   catsVis]   = useInView();
  const [featRef,   featVis]   = useInView();
  const [howRef,    howVis]    = useInView();
  const [whyRef,    whyVis]    = useInView();
  const [testimRef, testimVis] = useInView();
  const [recentRef, recentVis] = useInView();
  const [ctaRef,    ctaVis]    = useInView(0.12);

  useEffect(() => {
    supabase
      .from("listings")
      .select("*")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        const rows = (data as Product[]) ?? [];
        setFeatured(rows.slice(0, 8));
        setRecent(rows.slice(0, 3));
      });
  }, []);

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#3d0010", minHeight: "100vh" }}
      >
        {/* Full-screen hero background image */}
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          style={{ opacity: 0.45 }}
        />

        {/* Directional gradient — dark on the left so text is always readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, rgba(61,0,16,0.97) 0%, rgba(61,0,16,0.82) 45%, rgba(61,0,16,0.35) 75%, rgba(61,0,16,0.10) 100%)",
          }}
        />

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url(${pattern})`, backgroundSize: "350px" }}
        />

        {/* Ambient glows */}
        <div
          className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #d4a857 0%, transparent 65%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute -bottom-40 right-20 h-[400px] w-[400px] rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #d4a857 0%, transparent 65%)", filter: "blur(80px)" }}
        />

        {/* ── Desktop layout — text left, floating product accent right ── */}
        <div className="relative hidden min-h-[100vh] lg:flex lg:items-center">
          {/* LEFT — text */}
          <div className="flex flex-col justify-center px-12 py-16 xl:px-20" style={{ maxWidth: "620px" }}>
            <div className="animate-float-in">

              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-paper/90 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-gold" />
                Kathmandu Valley's #1 Second-Hand Market
              </div>

              {/* Headline */}
              <h1
                className="font-display text-[4.5rem] font-bold leading-[1.0] xl:text-[5.5rem]"
                style={{ color: "#f5f0e8" }}
              >
                Buy smart.<br />
                Sell easy.<br />
                <span style={{ color: "#d4a857" }}>Live circular.</span>
              </h1>

              <p
                className="mt-4 text-base italic"
                style={{
                  color: "rgba(245,240,232,0.7)",
                  fontFamily: '"Tiro Devanagari Sanskrit", serif',
                }}
              >
                किन्नुहोस्, बेच्नुहोस्, पुन: प्रयोग गर्नुहोस् — एकै ठाउँमा।
              </p>

              <p
                className="mt-4 text-base leading-relaxed"
                style={{ color: "rgba(245,240,232,0.72)", maxWidth: "420px" }}
              >
                The valley's most trusted marketplace for second-hand goods. Fair prices, verified sellers, and Khalti-easy payments — right here in Kathmandu, Lalitpur, and Bhaktapur.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex gap-3">
                <Link
                  to="/browse"
                  className="btn-shimmer inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-ink shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  style={{ background: "linear-gradient(135deg, #d4a857, #b8872a)" }}
                >
                  Browse Listings <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/sell"
                  className="btn-shimmer inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-[1.02]"
                  style={{ borderColor: "rgba(255,255,255,0.25)", color: "#f5f0e8" }}
                >
                  Post an Item
                </Link>
              </div>

              {/* Valley district pills */}
              <div className="mt-7 flex flex-wrap gap-2">
                {VALLEY_DISTRICTS.map((d) => (
                  <Link
                    key={d.name}
                    to="/browse"
                    search={{ district: d.name } as any}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-paper/80 backdrop-blur-sm transition-colors hover:bg-white/15"
                  >
                    <MapPin className="h-3 w-3" style={{ color: "#d4a857" }} />
                    {d.name}
                  </Link>
                ))}
              </div>

              {/* Stats row */}
              <div
                className="mt-8 flex gap-8 border-t pt-8"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
              >
                {[
                  { n: "3",    l: "Districts",   s: "Full Valley" },
                  { n: "10+",  l: "Sellers",     s: "Verified"    },
                  { n: "10★",  l: "Reviews",     s: "Real buyers" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="font-display text-2xl font-bold" style={{ color: "#d4a857" }}>{s.n}</div>
                    <div className="text-sm font-semibold" style={{ color: "#f5f0e8" }}>{s.l}</div>
                    <div className="text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>{s.s}</div>
                  </div>
                ))}
              </div>

              {/* Made in Nepal badge */}
              <div className="mt-7 inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-lg">🇳🇵</span>
                <span className="text-sm font-semibold" style={{ color: "#f5f0e8" }}>Made in Nepal</span>
                <span className="text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>· For Kathmandu Valley</span>
              </div>
            </div>
          </div>

          {/* RIGHT — floating product accent from mega-love */}
          <div className="absolute right-0 top-0 hidden h-full w-[46%] lg:flex items-end justify-center overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "radial-gradient(circle at 60% 50%, rgba(212,168,87,0.12) 0%, transparent 65%)" }}
            />
            <img
              src={hero}
              alt="SecondSync Valley shopping"
              className="relative z-10 h-full w-full object-cover object-bottom"
              style={{
                filter: "drop-shadow(-12px 0 50px rgba(61,0,16,0.95)) drop-shadow(0 -4px 30px rgba(212,168,87,0.15))",
                animation: "bob 5s ease-in-out infinite",
              }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-32"
              style={{ background: "linear-gradient(to right, rgba(61,0,16,0.85) 0%, transparent 100%)" }}
            />
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="relative flex flex-col items-center px-6 pb-10 pt-12 text-center lg:hidden">
          <div className="animate-float-in">
            <div
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold"
              style={{ color: "#f5f0e8" }}
            >
              <Sparkles className="h-3 w-3" style={{ color: "#d4a857" }} />
              Kathmandu Valley Marketplace
            </div>
            <h1
              className="font-display text-5xl font-bold leading-tight"
              style={{ color: "#f5f0e8" }}
            >
              Buy smart.<br />Sell easy.<br />
              <span style={{ color: "#d4a857" }}>Live circular.</span>
            </h1>
            <p
              className="mt-3 text-sm italic"
              style={{
                color: "rgba(245,240,232,0.7)",
                fontFamily: '"Tiro Devanagari Sanskrit", serif',
              }}
            >
              काठमाडौं उपत्यकाको आफ्नै बजार
            </p>
            <div className="mt-5 flex justify-center gap-2.5 flex-wrap">
              {VALLEY_DISTRICTS.map((d) => (
                <span key={d.name} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-xs text-paper/70">
                  <MapPin className="h-2.5 w-2.5" style={{ color: "#d4a857" }} /> {d.name}
                </span>
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-ink"
                style={{ background: "linear-gradient(135deg, #d4a857, #b8872a)" }}
              >
                Browse <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/sell"
                className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold"
                style={{ borderColor: "rgba(255,255,255,0.25)", color: "#f5f0e8" }}
              >
                Sell
              </Link>
            </div>
          </div>
        </div>

        <div className="h-1 nepali-divider" />
      </section>

      {/* ─── TICKER ───────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-b border-border bg-ink py-3.5 text-paper">
        <div className="flex animate-ticker gap-12 whitespace-nowrap text-xs uppercase tracking-[0.2em] text-paper/70">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12">
              <span>★ Kathmandu · Lalitpur · Bhaktapur</span>
              <span>·</span>
              <span>Khalti Payment Gateway</span>
              <span>·</span>
              <span>Pathao Same-Day Delivery</span>
              <span>·</span>
              <span>Free listing, always</span>
              <span>·</span>
              <span>काठमाडौं उपत्यकाको आफ्नै बजार</span>
              <span>·</span>
              <span>Verified Valley Sellers</span>
              <span>·</span>
              <span>Safe-meet points across the valley</span>
              <span>·</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── IMPACT STATS ─────────────────────────────────────────────── */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div ref={statsRef as any} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Package,    value: "10+",       label: "Active Listings",   np: "सक्रिय सूचीहरू" },
              { icon: MapPin,     value: "3",         label: "Valley Districts",  np: "उपत्यका जिल्लाहरू" },
              { icon: TrendingUp, value: "Rs 10,000", label: "Traded Monthly",    np: "मासिक व्यापार"  },
              { icon: Recycle,    value: "10g+",      label: "Kept from Landfill",np: "फोहोर बचाइयो"   },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-card ${statsVis ? "animate-fade-up" : "opacity-0"}`}
                style={statsVis ? { animationDelay: `${i * 90}ms` } : undefined}
              >
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
      <section id="categories" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Categories · वर्गहरू"
            title="Find what you love"
            subtitle="Tap any category to see all listings in the Kathmandu Valley."
          />
          <Link to="/browse" className="text-sm font-semibold text-crimson hover:underline">
            Browse all →
          </Link>
        </div>

        <div ref={catsRef as any} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          {categories
            .filter((c) => c.slug !== "all")
            .map((c, i) => {
              const Icon = CAT_ICONS[c.slug] ?? Sparkles;
              const color = CAT_COLORS[c.slug] ?? "#3d0010";
              return (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className={`group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-2.5 hover:shadow-elegant hover:border-transparent ${catsVis ? "animate-scale-pop" : "opacity-0"}`}
                  style={catsVis ? { animationDelay: `${i * 55}ms` } : undefined}
                >
                  {/* Hover color wash */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `${color}18` }}
                  />

                  <div
                    className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-crimson transition-all duration-300 group-hover:scale-110"
                    style={{ "--hover-bg": color } as React.CSSProperties}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: color }}
                    />
                    <Icon className="relative h-6 w-6 transition-colors group-hover:text-paper" />
                  </div>

                  <div className="relative">
                    <div className="font-display text-sm font-semibold text-ink group-hover:text-ink transition-colors">
                      {c.name}
                    </div>
                    <div
                      className="text-xs text-muted-foreground"
                      style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
                    >
                      {c.np}
                    </div>
                  </div>

                  <div className="relative flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-crimson">
                    Browse <ChevronRight className="h-3 w-3" />
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
              title="Fresh valley listings"
              subtitle="The latest finds from verified sellers across all three districts."
            />
            <Link to="/browse" className="text-sm font-semibold text-crimson hover:underline">
              View all →
            </Link>
          </div>
          <div ref={featRef as any} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.length > 0
              ? featured.map((p, i) => (
                  <div
                    key={p.id}
                    className={featVis ? "animate-fade-up" : "opacity-0"}
                    style={featVis ? { animationDelay: `${i * 55}ms` } : undefined}
                  >
                    <ProductCard p={p} compact />
                  </div>
                ))
              : (
                <p className="col-span-4 py-10 text-center text-muted-foreground">
                  No listings yet —{" "}
                  <Link to="/sell" className="text-crimson hover:underline">
                    be the first to post
                  </Link>
                  .
                </p>
              )
            }
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="How It Works · कसरी काम गर्छ"
            title="Trading made simple"
            subtitle="From snap to sale in four steps. No fees. No hassle. Just the valley."
          />
          <div ref={howRef as any} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className={`relative ${howVis ? "animate-fade-up" : "opacity-0"}`}
                style={howVis ? { animationDelay: `${i * 100}ms` } : undefined}
              >
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute right-0 top-6 hidden h-0.5 w-full translate-x-1/2 bg-border lg:block" />
                )}
                <div className="relative z-10 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card hover:-translate-y-1 transition-transform">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold text-ink">
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
        </div>
      </section>

      {/* ─── WHY SECONDSYNC ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why SecondSync · किन SecondSync"
          title="Built for the valley"
          subtitle="Everything we've built is designed for Kathmandu's fast-paced, trust-first culture."
        />
        <div ref={whyRef as any} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              i: Shield,
              t: "ID Verification",
              np: "परिचय प्रमाणीकरण",
              d: "Full ID verification via citizenship & OTP is coming soon. Every valley seller will be blue-tick verified.",
              badge: "Coming Soon",
            },
            {
              i: Truck,
              t: "Pathao Delivery",
              np: "पाथाओ डेलिभरी",
              d: "Doorstep delivery across all three valley districts — same-day available for most Kathmandu orders.",
            },
            {
              i: Recycle,
              t: "Circular by Design",
              np: "पुन: प्रयोग",
              d: "We've helped keep hundreds of kilograms of goods out of Kathmandu's landfills since launch.",
            },
            {
              i: BadgeCheck,
              t: "5-Star Community",
              np: "समुदाय",
              d: "Real ratings from real valley buyers and sellers. Every review is verified and tied to a completed trade.",
            },
          ].map((f, i) => (
            <div
              key={f.t}
              className={`group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-2 hover:border-gold/40 hover:shadow-elegant ${whyVis ? "animate-fade-up" : "opacity-0"}`}
              style={whyVis ? { animationDelay: `${i * 90}ms` } : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold text-ink transition-transform group-hover:scale-110">
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
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Community Stories · समुदायका कथाहरू"
            title="Loved by valley people"
            subtitle="Real stories from real buyers and sellers across Kathmandu, Lalitpur, and Bhaktapur."
          />
          <div ref={testimRef as any} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 shadow-card hover:shadow-elegant hover:-translate-y-1.5 transition-all duration-300 ${testimVis ? "animate-fade-up" : "opacity-0"}`}
                style={testimVis ? { animationDelay: `${i * 110}ms` } : undefined}
              >
                <Quote className="h-8 w-8 text-gold/40" />
                <p className="text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-display text-sm font-bold text-ink">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">{t.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {t.city}, Valley
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
        </div>
      </section>

      {/* ─── RECENT LISTINGS ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Just Listed · भर्खर पोस्ट"
            title="Hot off the press"
            subtitle="These just went live in the valley — grab them before someone else does."
          />
          <Link to="/browse" className="text-sm font-semibold text-crimson hover:underline">
            See all new listings →
          </Link>
        </div>
        <div ref={recentRef as any} className="mt-10 grid gap-5 sm:grid-cols-3">
          {recent.length > 0 ? recent.map((item, i) => (
            <Link
              key={item.id}
              to="/product/$id"
              params={{ id: item.id }}
              className={`group flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-1.5 hover:shadow-elegant ${recentVis ? "animate-fade-up" : "opacity-0"}`}
              style={recentVis ? { animationDelay: `${i * 90}ms` } : undefined}
            >
              <img
                src={item.images?.[0] ?? "/placeholder.jpg"}
                alt={item.title}
                className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
              />
              <div className="flex min-w-0 flex-col justify-between gap-1">
                <div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-crimson">
                    {item.category}
                  </span>
                  <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold text-ink leading-snug group-hover:text-crimson transition-colors">
                    {item.title}
                  </h3>
                </div>
                <div>
                  <div className="font-display text-base font-bold text-crimson">
                    Rs {formatNpr(item.price)}
                  </div>
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
              No listings yet.{" "}
              <Link to="/sell" className="text-crimson hover:underline">
                Post the first one →
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ─── PAYMENT & LOGISTICS ──────────────────────────────────────── */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Payments */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                Accepted Payment Methods
              </p>
              <div className="flex flex-wrap gap-3">
                {/* Khalti */}
                <div className="flex items-center gap-2.5 rounded-2xl border border-purple-200 bg-card px-5 py-3.5 shadow-card hover:shadow-elegant transition-shadow">
                  <img src={khaltiPng} alt="Khalti" className="h-8 w-auto flex-shrink-0 rounded-lg" style={{ objectFit:"contain" }} />
                  <div>
                    <div className="font-display text-sm font-bold text-ink">Khalti</div>
                    <div className="text-[10px] text-purple-600 font-semibold">Secure digital payment</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Logistics */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                Valley Delivery Partners
              </p>
              <div className="flex flex-wrap gap-3">
                {/* Pathao */}
                <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-card hover:shadow-elegant transition-shadow">
                  <img src={pathaoPng} alt="Pathao" className="h-8 w-auto flex-shrink-0 rounded-lg" style={{ objectFit:"contain" }} />
                  <div>
                    <div className="font-display text-sm font-bold text-ink">Pathao</div>
                    <div className="text-[10px] text-muted-foreground">Rs 200 · Same-day valley</div>
                  </div>
                </div>

                {/* Real Cargo */}
                <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-card hover:shadow-elegant transition-shadow">
                  <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-[#1a3a8c] flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">RC</span>
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-ink">Real Cargo</div>
                    <div className="text-[10px] text-muted-foreground">Rs 150 · Inter-district</div>
                  </div>
                </div>

                {/* Self pickup */}
                <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-card">
                  <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-secondary flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-ink">Self Pickup</div>
                    <div className="text-[10px] text-muted-foreground">Free · Safe-meet points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SELL PROMO CTA ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div
          ref={ctaRef as any}
          className={`relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-paper shadow-elegant sm:p-16 ${ctaVis ? "animate-scale-pop" : "opacity-0"}`}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: `url(${pattern})`, backgroundSize: "320px" }}
          />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-crimson/30 blur-3xl pointer-events-none" />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/10 px-3 py-1 text-xs font-medium text-paper/80 backdrop-blur">
                <Zap className="h-3.5 w-3.5 text-gold" /> List in 60 seconds · Free forever
              </div>
              <h2 className="mt-4 font-display text-4xl font-bold text-balance sm:text-5xl">
                Got something gathering dust?{" "}
                <span className="text-gold">Turn it into cash.</span>
              </h2>
              <p className="mt-4 text-base text-paper/80">
                Post in 60 seconds. We'll show it to buyers across the entire Kathmandu Valley — no listing fees, no commission. Just your stuff finding a new home.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/sell"
                  className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-ink shadow-card transition-all hover:scale-105 hover:shadow-elegant"
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
                { icon: Clock,        title: "60-sec posting", desc: "Go live faster than a cup of chiya." },
                { icon: PhoneCall,    title: "Direct contact", desc: "Buyers reach you instantly." },
                { icon: BadgeCheck,   title: "Seller badge",   desc: "Build trust, earn more." },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-paper/15 bg-paper/10 p-5 backdrop-blur hover:bg-paper/15 transition-colors"
                >
                  <card.icon className="h-5 w-5 text-gold" />
                  <div className="mt-2 font-display text-sm font-semibold text-paper">{card.title}</div>
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

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const [ref, vis] = useInView(0.1);
  return (
    <div ref={ref as any} className="max-w-2xl">
      <div className={`text-xs font-semibold uppercase tracking-[0.25em] text-crimson ${vis ? "animate-slide-right" : "opacity-0"}`}>{eyebrow}</div>
      <h2 className={`mt-3 font-display text-4xl font-bold text-ink text-balance sm:text-5xl ${vis ? "animate-fade-up" : "opacity-0"}`} style={vis ? { animationDelay: "60ms" } : undefined}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-muted-foreground ${vis ? "animate-fade-up" : "opacity-0"}`} style={vis ? { animationDelay: "120ms" } : undefined}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
