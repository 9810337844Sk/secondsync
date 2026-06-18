import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Tag, Eye, Package, Clock, MapPin, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { formatNpr, timeAgo, type Product } from "@/lib/products";

export const Route = createFileRoute("/my-listings")({
  head: () => ({
    meta: [{ title: "My Listings — Second Sync" }],
  }),
  component: MyListingsPage,
});

function MyListingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionId, setActionId]       = useState<string | null>(null);
  const [confirmId, setConfirmId]     = useState<string | null>(null);
  const [tab, setTab]                 = useState<"active" | "sold" | "all">("active");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    fetchListings();
  }, [user, authLoading]);

  async function fetchListings() {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("seller_id", user!.id)
      .eq("is_active", true)
      .order("posted_at", { ascending: false });
    setListings((data as Product[]) ?? []);
    setLoading(false);
  }

  async function toggleSold(listing: Product) {
    setActionId(listing.id);
    await supabase.from("listings").update({ is_sold: !listing.is_sold }).eq("id", listing.id).eq("seller_id", user!.id);
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_sold: !l.is_sold } : l));
    setActionId(null);
  }

  async function removeListing(id: string) {
    setActionId(id);
    const { error } = await supabase.from("listings").update({ is_active: false })
      .eq("id", id).eq("seller_id", user!.id);
    if (error) {
      await supabase.from("listings").delete().eq("id", id).eq("seller_id", user!.id);
    }
    setListings(prev => prev.filter(l => l.id !== id));
    setConfirmId(null);
    setActionId(null);
  }

  if (authLoading || (!user && !authLoading)) return null;

  const filtered = listings.filter(l =>
    tab === "active" ? !l.is_sold :
    tab === "sold"   ?  l.is_sold :
    true
  );

  const counts = {
    active: listings.filter(l => !l.is_sold).length,
    sold:   listings.filter(l =>  l.is_sold).length,
    all:    listings.length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-crimson">
            My Listings · मेरा सामान
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">Your Listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.all === 0 ? "You haven't posted anything yet." : `${counts.all} listing${counts.all !== 1 ? "s" : ""} · ${counts.active} active · ${counts.sold} sold`}
          </p>
        </div>
        <Link
          to="/sell"
          className="inline-flex items-center gap-2 rounded-full bg-crimson px-5 py-2.5 text-sm font-semibold text-paper shadow-card transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Post New
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-2xl border border-border bg-card p-1 w-fit">
        {(["active", "sold", "all"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition-all ${tab === t ? "bg-crimson text-paper shadow-sm" : "text-muted-foreground hover:text-ink"}`}
          >
            {t} <span className="ml-1 rounded-full bg-current/10 px-1.5 py-0.5 text-xs">{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-crimson" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink">
              {tab === "sold" ? "No sold items yet." : tab === "active" ? "No active listings." : "Nothing here yet."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Start by posting your first item for free.</p>
          </div>
          <Link to="/sell" className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform">
            + Post an Item
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              actionId={actionId}
              confirmId={confirmId}
              onToggleSold={() => toggleSold(listing)}
              onConfirmRemove={() => setConfirmId(listing.id)}
              onCancelRemove={() => setConfirmId(null)}
              onRemove={() => removeListing(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing, actionId, confirmId,
  onToggleSold, onConfirmRemove, onCancelRemove, onRemove,
}: {
  listing: Product;
  actionId: string | null;
  confirmId: string | null;
  onToggleSold: () => void;
  onConfirmRemove: () => void;
  onCancelRemove: () => void;
  onRemove: () => void;
}) {
  const busy = actionId === listing.id;
  const confirming = confirmId === listing.id;
  const cover = listing.images?.[0] ?? "/placeholder.jpg";

  return (
    <div className={`rounded-2xl border bg-card shadow-card overflow-hidden transition-all ${listing.is_sold ? "border-border opacity-80" : "border-border hover:border-crimson/30 hover:shadow-elegant"}`}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img src={cover} alt={listing.title} className={`h-full w-full object-cover transition-transform hover:scale-105 ${listing.is_sold ? "brightness-60" : ""}`} />
        {listing.is_sold && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="rotate-[-15deg] rounded-xl border-4 border-red-500 px-4 py-1 text-xl font-black uppercase tracking-widest text-red-500 opacity-90">SOLD</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${listing.is_sold ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
            {listing.is_sold ? "Sold" : "Active"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-ink truncate">{listing.title}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-crimson">Rs {formatNpr(listing.price)}</span>
          <span className="text-xs text-muted-foreground capitalize">{listing.condition}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(listing.posted_at)}</span>
        </div>

        {/* Actions */}
        <div className="mt-4 border-t border-border pt-3 flex flex-wrap gap-2">
          <Link
            to="/product/$id"
            params={{ id: listing.id }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-crimson hover:text-crimson transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </Link>

          <button
            onClick={onToggleSold}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              listing.is_sold
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-border text-muted-foreground hover:border-ink hover:text-ink"
            }`}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
            {listing.is_sold ? "Relist" : "Mark Sold"}
          </button>

          {!confirming ? (
            <button
              onClick={onConfirmRemove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onRemove}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Confirm
              </button>
              <button
                onClick={onCancelRemove}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
