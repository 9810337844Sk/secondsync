import { Link } from "@tanstack/react-router";
import { MapPin, Clock, Heart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { formatNpr, timeAgo } from "@/lib/products";


const CONDITION_STYLE: Record<string, { bg: string; text: string }> = {
  "Like New": { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  Excellent:  { bg: "bg-blue-50 border-blue-200",       text: "text-blue-700"    },
  Good:       { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700"   },
  Fair:       { bg: "bg-orange-50 border-orange-200",   text: "text-orange-700"  },
};

export function ProductCard({ p, compact }: { p: Product; compact?: boolean }) {
  const cover = p.images?.[0] ?? "/placeholder.jpg";
  const [imgErr, setImgErr] = useState(false);
  const condStyle = CONDITION_STYLE[p.condition] ?? CONDITION_STYLE["Good"];
  const discount = p.original_price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : null;

  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-2.5 hover:shadow-elegant hover:border-crimson/15"
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-secondary ${compact ? "aspect-[4/3]" : "aspect-square"}`}>
        <img
          src={imgErr ? "/placeholder.jpg" : cover}
          alt={p.title}
          loading="lazy"
          onError={() => setImgErr(true)}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08] ${p.is_sold ? "brightness-[0.45] saturate-0" : ""}`}
        />

        {/* SOLD overlay */}
        {p.is_sold ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rotate-[-12deg] rounded-xl border-[3px] border-red-500 px-4 py-1.5 text-lg font-black uppercase tracking-widest text-red-500 bg-white/10 backdrop-blur-sm">
              SOLD
            </span>
          </div>
        ) : (
          <>
            {/* Condition badge */}
            <span className={`absolute left-2.5 top-2.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${condStyle.bg} ${condStyle.text}`}>
              {p.condition}
            </span>
            {/* Discount badge */}
            {discount && discount > 0 && (
              <span className="absolute right-2.5 top-2.5 animate-scale-pop rounded-full bg-crimson px-2 py-0.5 text-[10px] font-bold text-paper">
                -{discount}%
              </span>
            )}
          </>
        )}

        {/* Bottom overlay with view hint */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            View listing →
          </span>
        </div>

        {/* Gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className={`flex flex-col gap-1 ${compact ? "p-3" : "p-4"}`}>
        <h3 className="line-clamp-1 font-display text-sm font-semibold text-ink leading-snug group-hover:text-crimson transition-colors duration-200">
          {p.title}
        </h3>
        {!compact && p.title_np && (
          <p
            className="line-clamp-1 text-xs text-muted-foreground"
            style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
          >
            {p.title_np}
          </p>
        )}

        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className={`btn-shimmer font-display font-bold text-crimson ${compact ? "text-base" : "text-lg"}`}>
            Rs {formatNpr(p.price)}
          </span>
          {p.original_price && (
            <span className="text-[11px] text-muted-foreground line-through">
              Rs {formatNpr(p.original_price)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-0.5 min-w-0">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{p.location}</span>
          </span>
          <span className="flex items-center gap-0.5 flex-shrink-0 ml-1">
            <Clock className="h-3 w-3" />
            {timeAgo(p.posted_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
