import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User, Package, ShoppingBag, Settings, LogOut,
  CheckCircle2, Clock, MapPin, Edit3, Save, X,
  Loader2, BadgeCheck, Eye, Tag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { formatNpr, timeAgo, type Product } from "@/lib/products";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — Second Sync" }] }),
  component: DashboardPage,
});

type Tab = "overview" | "listings" | "orders" | "settings";

type Order = {
  id: string;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

function DashboardPage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  if (authLoading || !user || !profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-crimson" />
      </div>
    );
  }

  const displayName = profile.full_name || user.email?.split("@")[0] || "User";
  const initials    = displayName[0].toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-crimson to-crimson/70 font-display text-2xl font-bold text-paper shadow-card">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink">{displayName}</h1>
              {profile.is_verified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Member since {new Date(profile.created_at).toLocaleDateString("en-NP", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <button onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1">
        {([
          { id: "overview", label: "Overview",  icon: <User className="h-4 w-4" /> },
          { id: "listings", label: "My Listings", icon: <Tag className="h-4 w-4" /> },
          { id: "orders",   label: "My Orders",   icon: <ShoppingBag className="h-4 w-4" /> },
          { id: "settings", label: "Settings",    icon: <Settings className="h-4 w-4" /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${tab === t.id ? "bg-crimson text-paper shadow-sm" : "text-muted-foreground hover:text-ink"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && <OverviewTab userId={user.id} profile={profile} />}
      {tab === "listings" && <ListingsTab userId={user.id} />}
      {tab === "orders"   && <OrdersTab  email={user.email ?? ""} />}
      {tab === "settings" && <SettingsTab profile={profile} userId={user.id} onSaved={refreshProfile} />}
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────── */
function OverviewTab({ userId, profile }: { userId: string; profile: any }) {
  const [stats, setStats] = useState({ active: 0, sold: 0, orders: 0 });
  const [recent, setRecent] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const { data: listings } = await supabase.from("listings").select("is_sold")
        .eq("seller_id", userId).eq("is_active", true);
      const active = listings?.filter(l => !l.is_sold).length ?? 0;
      const sold   = listings?.filter(l =>  l.is_sold).length ?? 0;

      const { count: orders } = await supabase.from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("email", profile.email).like("subject", "Order:%");

      const { data: recentData } = await supabase.from("listings").select("*")
        .eq("seller_id", userId).eq("is_active", true).order("posted_at", { ascending: false }).limit(3);

      setStats({ active, sold, orders: orders ?? 0 });
      setRecent((recentData as Product[]) ?? []);
    }
    load();
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Listings", value: stats.active, icon: <Tag className="h-5 w-5 text-crimson" />,        color: "bg-crimson/5 border-crimson/20" },
          { label: "Items Sold",      value: stats.sold,   icon: <CheckCircle2 className="h-5 w-5 text-green-600" />, color: "bg-green-50 border-green-200" },
          { label: "Orders Placed",   value: stats.orders, icon: <ShoppingBag className="h-5 w-5 text-blue-500" />,   color: "bg-blue-50 border-blue-200" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <div className="flex items-center gap-2">{s.icon}<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span></div>
            <p className="mt-2 font-display text-3xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Account status */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-ink mb-3">Account Status</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            {profile.is_verified
              ? <><BadgeCheck className="h-4 w-4 text-green-600" /><span className="text-green-700 font-medium">Email Verified</span></>
              : <><X className="h-4 w-4 text-red-500" /><span className="text-red-600">Email not verified</span></>}
          </div>
          <div className="flex items-center gap-2">
            {profile.is_admin
              ? <><BadgeCheck className="h-4 w-4 text-amber-600" /><span className="text-amber-700 font-medium">Admin</span></>
              : <><User className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Regular member</span></>}
          </div>
          {profile.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>📱</span><span>+977-{profile.phone}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /><span>{profile.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent listings */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink">Recent Listings</h3>
            <Link to="/my-listings" className="text-xs text-crimson hover:underline">View all →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recent.map(l => (
              <Link key={l.id} to="/product/$id" params={{ id: l.id }}
                className="flex gap-3 rounded-xl border border-border bg-card p-3 hover:border-crimson/40 transition-colors">
                <img src={l.images?.[0]} alt={l.title} className="h-14 w-14 rounded-lg object-cover flex-shrink-0 bg-secondary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{l.title}</p>
                  <p className="text-xs font-bold text-crimson">Rs {formatNpr(l.price)}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(l.posted_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Listings Tab ─────────────────────────────────────────────── */
function ListingsTab({ userId }: { userId: string }) {
  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("listings").select("*").eq("seller_id", userId)
      .eq("is_active", true).order("posted_at", { ascending: false })
      .then(({ data }) => { setListings((data as Product[]) ?? []); setLoading(false); });
  }, [userId]);

  async function toggleSold(l: Product) {
    setActionId(l.id);
    await supabase.from("listings").update({ is_sold: !l.is_sold }).eq("id", l.id).eq("seller_id", userId);
    setListings(prev => prev.map(x => x.id === l.id ? { ...x, is_sold: !l.is_sold } : x));
    setActionId(null);
  }

  async function remove(id: string) {
    setActionId(id);
    await supabase.from("listings").update({ is_active: false }).eq("id", id).eq("seller_id", userId);
    setListings(prev => prev.filter(x => x.id !== id));
    setConfirmId(null); setActionId(null);
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-crimson" /></div>;
  if (listings.length === 0) return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Package className="h-12 w-12 text-muted-foreground" />
      <p className="font-semibold text-ink">No listings yet</p>
      <Link to="/sell" className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform">+ Post your first item</Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{listings.length} listing{listings.length !== 1 ? "s" : ""}</p>
        <Link to="/sell" className="inline-flex items-center gap-1.5 rounded-full bg-crimson px-4 py-2 text-xs font-semibold text-paper shadow-card hover:scale-105 transition-transform">
          + New listing
        </Link>
      </div>
      <div className="space-y-3">
        {listings.map(l => (
          <div key={l.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-crimson/30 transition-colors">
            <img src={l.images?.[0]} alt={l.title} className="h-16 w-16 rounded-xl object-cover flex-shrink-0 bg-secondary" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-ink truncate">{l.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${l.is_sold ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                  {l.is_sold ? "Sold" : "Active"}
                </span>
              </div>
              <p className="text-sm font-bold text-crimson mt-0.5">Rs {formatNpr(l.price)}</p>
              <p className="text-xs text-muted-foreground">{l.location} · {timeAgo(l.posted_at)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/product/$id" params={{ id: l.id }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:border-crimson hover:text-crimson transition-colors">
                <Eye className="h-4 w-4" />
              </Link>
              <button onClick={() => toggleSold(l)} disabled={actionId === l.id}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-50">
                {actionId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              </button>
              {confirmId !== l.id ? (
                <button onClick={() => setConfirmId(l.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={() => remove(l.id)} disabled={actionId === l.id}
                    className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                    {actionId === l.id ? "…" : "Yes"}
                  </button>
                  <button onClick={() => setConfirmId(null)}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-secondary">
                    No
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Orders Tab ───────────────────────────────────────────────── */
function OrdersTab({ email }: { email: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("contact_messages").select("*")
      .eq("email", email).like("subject", "Order:%")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setOrders((data as Order[]) ?? []); setLoading(false); });
  }, [email]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-crimson" /></div>;
  if (orders.length === 0) return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
      <p className="font-semibold text-ink">No orders yet</p>
      <p className="text-sm text-muted-foreground">Browse listings and place your first order.</p>
      <Link to="/browse" className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card hover:scale-105 transition-transform">Browse listings</Link>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
      {orders.map(o => {
        // Parse key fields from message text
        const lines = o.message.split("\n");
        const get   = (prefix: string) => lines.find(l => l.startsWith(prefix))?.replace(prefix, "").trim() ?? "—";
        return (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{o.subject.replace("Order: ", "")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(o.created_at).toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 flex-shrink-0">
                Sent to seller
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div><span className="text-muted-foreground">Total: </span><span className="font-bold text-crimson">{get("Total:")}</span></div>
              <div><span className="text-muted-foreground">Payment: </span><span className="font-medium">{get("Payment:")}</span></div>
              <div><span className="text-muted-foreground">Delivery: </span><span className="font-medium capitalize">{get("Delivery:").split(" ")[0]}</span></div>
              {get("Address:") !== "—" && (
                <div><span className="text-muted-foreground">Address: </span><span className="font-medium">{get("Address:")}</span></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Settings Tab ─────────────────────────────────────────────── */
function SettingsTab({ profile, userId, onSaved }: { profile: any; userId: string; onSaved: () => void }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone]       = useState(profile.phone ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  // Password change
  const [curPw, setCurPw]     = useState("");
  const [newPw, setNewPw]     = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved]   = useState(false);
  const [pwError, setPwError]   = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const { error: dbErr } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      phone:     phone.trim(),
      location:  location.trim(),
    }).eq("id", userId);
    setSaving(false);
    if (dbErr) { setError("Could not save. Please try again."); return; }
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 3000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwSaved(false);
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(newPw)) { setPwError("Must contain uppercase letter."); return; }
    if (!/[^A-Za-z0-9]/.test(newPw)) { setPwError("Must contain a special character."); return; }
    setPwSaving(true);
    // Re-authenticate then update
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: profile.email, password: curPw });
    if (signInErr) { setPwSaving(false); setPwError("Current password is incorrect."); return; }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (updateErr) { setPwError(updateErr.message || "Could not update password."); return; }
    setPwSaved(true); setCurPw(""); setNewPw("");
    setTimeout(() => setPwSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Profile info */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-crimson" /> Profile Information
        </h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-ink">Full name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="mt-1 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Phone number</label>
            <div className="mt-1 flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-border bg-secondary px-3 text-sm font-medium text-ink">+977</span>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric" maxLength={10} placeholder="98XXXXXXXX"
                className="flex-1 rounded-r-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Kathmandu"
              className="mt-1 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm outline-none focus:border-crimson" />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
          {saved && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Profile saved successfully!
            </div>
          )}
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-crimson" /> Change Password
        </h3>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-ink">Current password</label>
            <div className="relative mt-1">
              <input type={showCur ? "text" : "password"} value={curPw}
                onChange={e => setCurPw(e.target.value)} placeholder="Current password" required
                className="w-full rounded-xl border border-border bg-paper px-4 py-3 pr-11 text-sm outline-none focus:border-crimson" />
              <button type="button" tabIndex={-1} onClick={() => setShowCur(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-ink transition-colors">
                {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">New password</label>
            <div className="relative mt-1">
              <input type={showNew ? "text" : "password"} value={newPw}
                onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 chars, uppercase, special" required
                className="w-full rounded-xl border border-border bg-paper px-4 py-3 pr-11 text-sm outline-none focus:border-crimson" />
              <button type="button" tabIndex={-1} onClick={() => setShowNew(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-ink transition-colors">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {pwError && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{pwError}</p>}
          {pwSaved && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Password updated!
            </div>
          )}
          <button type="submit" disabled={pwSaving}
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-paper shadow-card transition-all hover:scale-105 disabled:opacity-60">
            {pwSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update Password"}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground space-y-1">
        <p><strong className="text-ink">Email:</strong> {profile.email} {profile.is_verified && "✓"}</p>
        <p><strong className="text-ink">Member since:</strong> {new Date(profile.created_at).toLocaleDateString("en-NP", { day: "numeric", month: "long", year: "numeric" })}</p>
        <p className="text-xs text-muted-foreground/70 mt-2">Email address cannot be changed. Contact support if needed.</p>
      </div>
    </div>
  );
}
