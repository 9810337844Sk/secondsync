import { Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatNpr, timeAgo } from "@/lib/products";

export function ProductCard({ p, compact }: { p: Product; compact?: boolean }) {
  const cover = p.images?.[0] ?? "/placeholder.jpg";

  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className={`relative overflow-hidden bg-secondary ${compact ? "aspect-[4/3]" : "aspect-square"}`}>
        <img
          src={cover}
          alt={p.title}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${p.is_sold ? "brightness-50" : ""}`}
        />
        {p.is_sold ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rotate-[-15deg] rounded-xl border-4 border-red-500 px-4 py-1 text-xl font-black uppercase tracking-widest text-red-500 opacity-90">
              SOLD
            </span>
          </div>
        ) : (
          <>
            <span className="absolute left-3 top-3 rounded-full bg-paper/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
              {p.condition}
            </span>
            {p.original_price && (
              <span className="absolute right-3 top-3 rounded-full bg-crimson px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-paper">
                -{Math.round((1 - p.price / p.original_price) * 100)}%
              </span>
            )}
          </>
        )}
      </div>

      <div className={`space-y-1.5 ${compact ? "p-3" : "p-4"}`}>
        <h3 className="line-clamp-1 font-display text-sm font-semibold text-ink">{p.title}</h3>
        {!compact && p.title_np && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{p.title_np}</p>
        )}
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className={`font-display font-bold text-crimson ${compact ? "text-base" : "text-lg"}`}>
            Rs {formatNpr(p.price)}
          </span>
          {p.original_price && (
            <span className="text-xs text-muted-foreground line-through">
              Rs {formatNpr(p.original_price)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {p.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(p.posted_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
