import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Camera, Smartphone, Bike, Shirt, Sofa, BookOpen, Dumbbell, Gem, Sparkles,
  SlidersHorizontal, ChevronRight, X, MapPin, Filter, ChevronDown, ArrowUpDown,
} from "lucide-react";
import { categories, type Product, formatNpr, CONDITIONS, VALLEY_DISTRICTS } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const cat = categories.find((c) => c.slug === params.slug);
    return {
      meta: [
        { title: `${cat?.name ?? "Category"} — SecondSync Valley Market` },
        {
          name: "description",
          content: `Browse second-hand ${cat?.name ?? "items"} across Kathmandu, Lalitpur, and Bhaktapur on SecondSync.`,
        },
      ],
    };
  },
  component: CategoryPage,
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

const CAT_GRADIENTS: Record<string, string> = {
  electronics: "linear-gradient(135deg, #1a3a5c 0%, #0f2540 100%)",
  mobiles:     "linear-gradient(135deg, #1a3a4f 0%, #0c2030 100%)",
  vehicles:    "linear-gradient(135deg, #2d1a0a 0%, #1a0c00 100%)",
  fashion:     "linear-gradient(135deg, #3d0a2e 0%, #1a0012 100%)",
  furniture:   "linear-gradient(135deg, #1a2d0a 0%, #0c1a00 100%)",
  books:       "linear-gradient(135deg, #3d2a0a 0%, #1a1200 100%)",
  sports:      "linear-gradient(135deg, #0a2d1a 0%, #001a0c 100%)",
  antiques:    "linear-gradient(135deg, #3d1a0a 0%, #200800 100%)",
};

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first"       },
  { value: "price_asc",  label: "Price: Low → High"  },
  { value: "price_desc", label: "Price: High → Low"  },
  { value: "oldest",     label: "Oldest first"       },
];

const PER_PAGE = 12;

function CategoryPage() {
  const { slug } = Route.useParams();
  const cat = categories.find((c) => c.slug === slug);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const [district, setDistrict]   = useState("all");
  const [condition, setCondition] = useState("all");
  const [sort, setSort]           = useState("newest");
  const [minPrice, setMinPrice]   = useState("");
  const [maxPrice, setMaxPrice]   = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    if (slug !== "all") query = query.eq("category", slug);
    if (district !== "all") query = (query as any).ilike("location", `%${district}%`);
    if (condition !== "all") query = query.eq("condition", condition);
    if (minPrice)  query = query.gte("price", Number(minPrice));
    if (maxPrice)  query = query.lte("price", Number(maxPrice));

    switch (sort) {
      case "newest":     query = query.order("posted_at", { ascending: false }); break;
      case "price_asc":  query = query.order("price",     { ascending: true  }); break;
      case "price_desc": query = query.order("price",     { ascending: false }); break;
      case "oldest":     query = query.order("posted_at", { ascending: true  }); break;
    }

    query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    const { data, count } = await query;
    setProducts((data as Product[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [slug, district, condition, sort, minPrice, maxPrice, page]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(1);
  }, [slug]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const Icon = CAT_ICONS[slug] ?? Sparkles;
  const gradient = CAT_GRADIENTS[slug] ?? "linear-gradient(135deg, #3d0010 0%, #1a0008 100%)";
  const totalPages = Math.ceil(total / PER_PAGE);

  const hasFilters = district !== "all" || condition !== "all" || !!minPrice || !!maxPrice;

  function clearFilters() {
    setDistrict("all"); setCondition("all"); setMinPrice(""); setMaxPrice(""); setPage(1);
  }

  return (
    <div>
      {/* ─── Banner ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: gradient, minHeight: "220px" }}>
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #d4a857 0%, transparent 65%)", filter: "blur(60px)" }}
        />

        <div className="mx-auto flex max-w-7xl flex-col justify-end px-4 pb-10 pt-14 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-white/50">
            <Link to="/" className="hover:text-white/80 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80">Categories</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold">{cat?.name ?? slug}</span>
          </nav>

          <div className="flex items-center gap-5">
            <div
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{ background: "rgba(212,168,87,0.18)", border: "1px solid rgba(212,168,87,0.35)" }}
            >
              <Icon className="h-8 w-8" style={{ color: "#d4a857" }} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
                {cat?.name ?? slug}
              </h1>
              {cat?.np && (
                <p
                  className="mt-0.5 text-base text-white/60"
                  style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
                >
                  {cat.np} · Kathmandu Valley
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ─── Main content ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex gap-8 lg:items-start">

          {/* ── Sidebar filters (desktop) ── */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-crimson" /> Filters
                </h2>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] text-crimson hover:underline font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <FilterPanel
                district={district} setDistrict={setDistrict}
                condition={condition} setCondition={setCondition}
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                onApply={() => setPage(1)}
              />
            </div>
          </aside>

          {/* ── Products area ── */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-sm text-muted-foreground">
                  {loading ? "Loading…" : `${total.toLocaleString()} listing${total !== 1 ? "s" : ""}`}
                </span>
                {hasFilters && !loading && (
                  <span className="ml-2 rounded-full bg-crimson/10 px-2 py-0.5 text-xs font-semibold text-crimson">
                    Filtered
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setFilterOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-crimson" />}
                </button>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="appearance-none rounded-full border border-border bg-card py-2 pl-4 pr-8 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-crimson"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Category quick-links */}
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.filter((c) => c.slug !== "all").map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    c.slug === slug
                      ? "border-crimson bg-crimson text-paper"
                      : "border-border bg-card text-ink hover:border-crimson hover:text-crimson"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState slug={slug} onClear={clearFilters} hasFilters={hasFilters} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} p={p} compact />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink disabled:opacity-40 hover:border-crimson hover:text-crimson transition-colors"
                >
                  ← Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                          pg === page ? "bg-crimson text-paper" : "border border-border text-ink hover:border-crimson"
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink disabled:opacity-40 hover:border-crimson hover:text-crimson transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile filter drawer ───────────────────────────────────────── */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-paper p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-ink">Filters</h2>
              <button onClick={() => setFilterOpen(false)} className="rounded-full p-1.5 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <FilterPanel
              district={district} setDistrict={setDistrict}
              condition={condition} setCondition={setCondition}
              minPrice={minPrice} setMinPrice={setMinPrice}
              maxPrice={maxPrice} setMaxPrice={setMaxPrice}
              onApply={() => { setPage(1); setFilterOpen(false); }}
            />

            <div className="mt-6 flex gap-3">
              {hasFilters && (
                <button
                  onClick={() => { clearFilters(); setFilterOpen(false); }}
                  className="flex-1 rounded-full border border-border py-3 text-sm font-semibold text-ink"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => { setPage(1); setFilterOpen(false); }}
                className="flex-1 rounded-full bg-crimson py-3 text-sm font-semibold text-paper"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── FilterPanel ──────────────────────────────────────────────────────── */
function FilterPanel({
  district, setDistrict,
  condition, setCondition,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  onApply,
}: {
  district: string; setDistrict: (v: string) => void;
  condition: string; setCondition: (v: string) => void;
  minPrice: string; setMinPrice: (v: string) => void;
  maxPrice: string; setMaxPrice: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* District */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> District
        </h3>
        <div className="space-y-1">
          {[{ value: "all", label: "All Districts" }, ...VALLEY_DISTRICTS.map((d) => ({ value: d, label: d }))].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setDistrict(opt.value); onApply(); }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                district === opt.value
                  ? "bg-crimson/10 text-crimson font-semibold"
                  : "text-ink hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Condition
        </h3>
        <div className="space-y-1">
          {[{ value: "all", label: "Any Condition" }, ...CONDITIONS.map((c) => ({ value: c, label: c }))].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setCondition(opt.value); onApply(); }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                condition === opt.value
                  ? "bg-crimson/10 text-crimson font-semibold"
                  : "text-ink hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Price Range (Rs)
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={onApply}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-crimson"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={onApply}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-crimson"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── EmptyState ───────────────────────────────────────────────────────── */
function EmptyState({ slug, onClear, hasFilters }: { slug: string; onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Sparkles className="h-7 w-7" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">
          {hasFilters ? "No listings match your filters" : "No listings yet"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          {hasFilters
            ? "Try adjusting your filters to see more results."
            : `Be the first to post in ${slug} — it's completely free.`}
        </p>
      </div>
      {hasFilters ? (
        <button
          onClick={onClear}
          className="rounded-full border border-crimson/40 px-5 py-2 text-sm font-semibold text-crimson hover:bg-crimson/5 transition-colors"
        >
          Clear filters
        </button>
      ) : (
        <Link
          to="/sell"
          className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper hover:opacity-90 transition-opacity"
        >
          Post first listing →
        </Link>
      )}
    </div>
  );
}
