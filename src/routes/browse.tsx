import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, RefreshCw, PackageOpen, TrendingUp, Sparkles } from "lucide-react";
import { categories, type Product } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/lib/supabase";
import { getPersonalizedRecommendations, getTrendingListings, getViewHistory } from "@/lib/recommendations";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Listings — Second Sync" },
      { name: "description", content: "Browse verified second-hand listings across Nepal." },
    ],
  }),
  component: Browse,
});

const CONDITIONS = ["Like New", "Excellent", "Good", "Fair"];

function Browse() {
  const [products, setProducts]         = useState<Product[]>([]);
  const [loading, setLoading]           = useState(true);
  const [cat, setCat]                   = useState("all");
  const [q, setQ]                       = useState("");
  const [condition, setCondition]       = useState("all");
  const [sort, setSort]                 = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [trending, setTrending]         = useState<Product[]>([]);
  const [recommended, setRecommended]   = useState<Product[]>([]);
  const hasHistory = getViewHistory().length > 0;
  const isFiltered = cat !== "all" || condition !== "all" || q !== "";

  async function load() {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("*")
      .eq("is_active", true)
      .order("posted_at", { ascending: false });

    if (cat !== "all")       query = query.eq("category", cat);
    if (condition !== "all") query = query.eq("condition", condition);

    const { data } = await query;
    let rows = (data as Product[]) ?? [];

    // client-side search & sort
    if (q) rows = rows.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
    if (sort === "price_asc")  rows = [...rows].sort((a, b) => a.price - b.price);
    if (sort === "price_desc") rows = [...rows].sort((a, b) => b.price - a.price);

    setProducts(rows);
    setLoading(false);
  }

  useEffect(() => { load(); }, [cat, condition, sort]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Load recommendations once on mount
  useEffect(() => {
    getTrendingListings(undefined, 8).then(setTrending);
    if (hasHistory) {
      getPersonalizedRecommendations("", 6).then(setRecommended);
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-crimson">
            Marketplace · बजार
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">
            Browse listings
          </h1>
          <p className="mt-2 text-muted-foreground">
            {loading ? "Loading…" : `${products.length} item${products.length !== 1 ? "s" : ""} available across Nepal.`}
          </p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items… (e.g. iPhone, cycle)"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-crimson"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCat(c.slug)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                cat === c.slug
                  ? "border-crimson bg-crimson text-paper"
                  : "border-border bg-card text-ink hover:border-crimson"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Condition */}
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-crimson"
          >
            <option value="all">Any condition</option>
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-crimson"
          >
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </select>

          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-20 flex flex-col items-center gap-4 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-crimson" />
          <p className="text-sm">Loading listings…</p>
        </div>
      ) : products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} compact />)}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-display text-xl text-ink">No listings found</p>
          <p className="text-sm text-muted-foreground">Try a different category or be the first to post.</p>
          <Link
            to="/sell"
            className="mt-2 inline-flex rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper"
          >
            Post your item
          </Link>
        </div>
      )}

      {/* ── Personalized Recommendations ── */}
      {!isFiltered && recommended.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-5 w-5 text-gold" />
            <h2 className="font-display text-2xl font-bold text-ink">Recommended for You</h2>
            <span className="rounded-full bg-crimson/10 px-2.5 py-0.5 text-xs font-medium text-crimson">Based on your browsing</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recommended.map(p => <ProductCard key={p.id} p={p} compact />)}
          </div>
        </div>
      )}

      {/* ── Trending Now ── */}
      {!isFiltered && trending.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-crimson" />
            <h2 className="font-display text-2xl font-bold text-ink">Trending Now</h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Latest listings</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {trending.slice(0, 4).map(p => <ProductCard key={p.id} p={p} compact />)}
          </div>
        </div>
      )}
    </div>
  );
}
