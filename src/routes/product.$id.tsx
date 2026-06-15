import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Phone, Shield, Truck, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatNpr, timeAgo, type Product } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [{ title: "Listing — Second Sync" }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = useParams({ from: "/product/$id" });
  const [product, setProduct]   = useState<Product | null>(null);
  const [related, setRelated]   = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [imgIdx, setImgIdx]     = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (!data) { setNotFound(true); setLoading(false); return; }
      setProduct(data as Product);

      // Related: same category, exclude self
      const { data: rel } = await supabase
        .from("listings")
        .select("*")
        .eq("category", (data as Product).category)
        .eq("is_active", true)
        .neq("id", id)
        .limit(3);
      setRelated((rel as Product[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-crimson" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="p-20 text-center">
        <p className="font-display text-xl text-ink">Listing not found.</p>
        <Link to="/browse" className="mt-4 inline-flex rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper">
          Back to browse
        </Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const cover  = images[imgIdx] ?? images[0] ?? "/placeholder.jpg";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/browse"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-crimson"
      >
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">

        {/* Image gallery */}
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary aspect-square">
            <img
              src={cover}
              alt={product.title}
              className="h-full w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-paper/80 shadow backdrop-blur hover:bg-paper"
                >
                  <ChevronLeft className="h-5 w-5 text-ink" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-paper/80 shadow backdrop-blur hover:bg-paper"
                >
                  <ChevronRight className="h-5 w-5 text-ink" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                    i === imgIdx ? "border-crimson" : "border-border opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-crimson">
            {product.condition}
          </span>

          <h1 className="mt-4 font-display text-4xl font-bold text-ink">{product.title}</h1>
          {product.title_np && (
            <p
              className="mt-1 text-muted-foreground"
              style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
            >
              {product.title_np}
            </p>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-crimson">
              Rs {formatNpr(product.price)}
            </span>
            {product.original_price && (
              <span className="text-muted-foreground line-through">
                Rs {formatNpr(product.original_price)}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {product.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {timeAgo(product.posted_at)}
            </span>
          </div>

          <p className="mt-6 leading-relaxed text-ink/80">{product.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`tel:${product.phone ?? ""}`}
              className="inline-flex items-center gap-2 rounded-full bg-crimson px-6 py-3 text-sm font-semibold text-paper shadow-card transition-transform hover:scale-105"
            >
              <Phone className="h-4 w-4" /> Call seller
            </a>
            <a
              href={`https://wa.me/${(product.phone ?? "").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-ink hover:border-crimson"
            >
              WhatsApp
            </a>
          </div>

          {/* Seller card */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-gold font-display text-lg font-bold text-ink">
                {(product.seller_name || "S")[0].toUpperCase()}
              </div>
              <div>
                <div className="font-display font-semibold text-ink">{product.seller_name}</div>
                <div className="text-xs text-muted-foreground">Verified member</div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
              <Shield className="h-4 w-4 text-crimson" /> Safe-meet available
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
              <Truck className="h-4 w-4 text-crimson" /> Pathao delivery
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl font-bold text-ink">You might also like</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
