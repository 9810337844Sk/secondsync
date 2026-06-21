import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, TrendingUp,
  Ban, CheckCircle2, Search, RefreshCw,
  Eye, Clock, ShieldCheck, Lock, EyeOff, LogOut, Mail, MailOpen,
  Package, ShoppingCart, Trash2, Tag, MapPin, Phone, X, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { supabase, type UserProfile } from "@/lib/supabase";
import pattern from "@/assets/pattern.jpg";

const ADMIN_EMAIL    = "teamkalpantrix@gmail.com";
const ADMIN_PASSWORD = "MegaDilasha9090";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Second Sync" }] }),
  component: AdminPage,
});

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

/* ─── Root ────────────────────────────────────────────────────────── */
function AdminPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin_authed") === "1") setAuthed(true);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("admin_authed");
    setAuthed(false);
  }

  if (!authed) return <AdminLoginGate onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={handleLogout} />;
}

/* ─── Login Gate ─────────────────────────────────────────────────── */
function AdminLoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const emailOk    = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const passwordOk = password.trim() === ADMIN_PASSWORD.trim();
      if (emailOk && passwordOk) {
        sessionStorage.setItem("admin_authed", "1");
        onSuccess();
      } else {
        setError("Invalid admin credentials. Please try again.");
      }
      setLoading(false);
    }, 600);
  }

  return (
    /* Full-page dark overlay — inline style overrides the site's bg-paper */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 40%, #1c1c2e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflow: "auto",
      }}
    >
      {/* Pattern overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${pattern})`,
          backgroundSize: "280px",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />
      {/* Glow blobs */}
      <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "360px", height: "360px", borderRadius: "50%", background: "rgba(140,20,20,0.18)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "280px", height: "280px", borderRadius: "50%", background: "rgba(180,140,0,0.08)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "72px", height: "72px", borderRadius: "20px",
            background: "rgba(180,20,20,0.25)", border: "1px solid rgba(180,20,20,0.4)",
            marginBottom: "1rem",
          }}>
            <ShieldCheck style={{ width: "36px", height: "36px", color: "#e05050" }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 700, color: "#f5f0e8", margin: 0 }}>
            Admin Access
          </h1>
          <p style={{ color: "rgba(245,240,232,0.45)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
            Second Sync · Internal Panel
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "24px",
          padding: "2rem",
          backdropFilter: "blur(12px)",
        }}>
          <form onSubmit={handleLogin} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", color: "rgba(245,240,232,0.55)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="off"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "12px",
                  padding: "0.75rem 1rem",
                  color: "#f5f0e8",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#c0392b")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", color: "rgba(245,240,232,0.55)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="off"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: "12px",
                    padding: "0.75rem 2.75rem 0.75rem 1rem",
                    color: "#f5f0e8",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#c0392b")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(245,240,232,0.4)", padding: 0,
                  }}
                >
                  {show
                    ? <EyeOff style={{ width: "16px", height: "16px" }} />
                    : <Eye style={{ width: "16px", height: "16px" }} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)",
                borderRadius: "12px", padding: "0.75rem 1rem",
                color: "#f87171", fontSize: "0.85rem",
              }}>
                <Ban style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "0.25rem",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                background: loading ? "rgba(192,57,43,0.6)" : "#c0392b",
                color: "#fff",
                border: "none",
                borderRadius: "999px",
                padding: "0.9rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 16px rgba(192,57,43,0.35)",
              }}
            >
              {loading
                ? <><RefreshCw style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> Verifying…</>
                : <><Lock style={{ width: "16px", height: "16px" }} /> Enter Admin Panel</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "rgba(245,240,232,0.25)", fontSize: "0.72rem", marginTop: "1.5rem" }}>
          Restricted access · Second Sync Internal
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"overview" | "users" | "products" | "orders" | "messages">("overview");

  const tabs = [
    { id: "overview"  as const, label: "Overview",  icon: TrendingUp   },
    { id: "users"     as const, label: "Users",     icon: Users        },
    { id: "products"  as const, label: "Products",  icon: Package      },
    { id: "orders"    as const, label: "Orders",    icon: ShoppingCart },
    { id: "messages"  as const, label: "Messages",  icon: Mail         },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f5f0" }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e0d8", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#c0392b" }}>
                Admin Panel · प्रशासन
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 700, color: "#1a0a0a", margin: "0.2rem 0 0" }}>
                Dashboard
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "999px", padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, color: "#c0392b" }}>
                <ShieldCheck style={{ width: "16px", height: "16px" }} /> Admin Access
              </div>
              <button
                onClick={onLogout}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fff", border: "1px solid #e8e0d8", borderRadius: "999px", padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, color: "#666", cursor: "pointer" }}
              >
                <LogOut style={{ width: "14px", height: "14px" }} /> Sign Out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.25rem", marginTop: "1.25rem" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.6rem 1.1rem",
                  borderRadius: "12px 12px 0 0",
                  border: "none",
                  fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: tab === t.id ? "#c0392b" : "transparent",
                  color: tab === t.id ? "#fff" : "#888",
                }}
              >
                <t.icon style={{ width: "15px", height: "15px" }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {tab === "overview"  && <OverviewTab />}
        {tab === "users"     && <UsersTab />}
        {tab === "products"  && <ProductsTab />}
        {tab === "orders"    && <AdminOrdersTab />}
        {tab === "messages"  && <MessagesTab />}
      </div>
    </div>
  );
}

/* ─── Overview ───────────────────────────────────────────────────── */
type OrderStat = { status: string; count: number; color: string };

function OverviewTab() {
  const [stats, setStats] = useState({ totalUsers: 0, bannedUsers: 0, totalListings: 0, unreadMessages: 0 });
  const [orderStats, setOrderStats] = useState<OrderStat[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    async function load() {
      const [{ count: t }, { count: b }, { count: l }, { count: u }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("orders").select("status, total"),
      ]);
      setStats({ totalUsers: t ?? 0, bannedUsers: b ?? 0, totalListings: l ?? 0, unreadMessages: u ?? 0 });

      if (orders) {
        const byStatus: Record<string, number> = {};
        let rev = 0;
        for (const o of orders as { status: string; total: number }[]) {
          byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
          if (o.status === "completed") rev += o.total ?? 0;
        }
        setOrderTotal(orders.length);
        setRevenue(rev);
        const COLOR: Record<string, string> = {
          pending: "#D97706", confirmed: "#2563EB", completed: "#16A34A", cancelled: "#DC2626",
        };
        setOrderStats(
          Object.entries(byStatus).map(([status, count]) => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count,
            color: COLOR[status] ?? "#888",
          }))
        );
      }
    }
    load();
  }, []);

  const statCards = [
    { icon: Users,       label: "Total Users",      value: stats.totalUsers,      bg: "#EFF6FF", iconBg: "#DBEAFE", iconColor: "#2563EB" },
    { icon: Ban,         label: "Banned Users",     value: stats.bannedUsers,     bg: "#FFF1F1", iconBg: "#FEE2E2", iconColor: "#DC2626" },
    { icon: Package,     label: "Active Listings",  value: stats.totalListings,   bg: "#F0FDF4", iconBg: "#DCFCE7", iconColor: "#16A34A" },
    { icon: ShoppingCart,label: "Total Orders",     value: orderTotal,            bg: "#FFFBEB", iconBg: "#FEF3C7", iconColor: "#D97706" },
    { icon: Mail,        label: "Unread Messages",  value: stats.unreadMessages,  bg: "#FAF5FF", iconBg: "#EDE9FE", iconColor: "#7C3AED" },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a0a0a", marginBottom: "1.25rem" }}>
        Platform Overview
      </h2>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {statCards.map((c) => (
          <div key={c.label} style={{ background: c.bg, borderRadius: "16px", padding: "1.5rem", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "50%", background: c.iconBg }}>
              <c.icon style={{ width: "20px", height: "20px", color: c.iconColor }} />
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1a0a0a", margin: "0.75rem 0 0.2rem", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {c.value}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#666" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Order Dashboard chart */}
      <div style={{ marginTop: "2rem", display: "grid", gap: "1rem", gridTemplateColumns: "1fr 300px" }}>
        {/* Bar chart */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>
              Orders by Status
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#888" }}>{orderTotal} total orders</span>
          </div>
          {orderStats.length === 0 ? (
            <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "0.875rem" }}>
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderStats} barSize={48}>
                <XAxis dataKey="status" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e8e0d8", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: "0.82rem" }}
                  cursor={{ fill: "rgba(192,57,43,0.05)" }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {orderStats.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue + legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "linear-gradient(135deg, #c0392b, #8e1a10)", borderRadius: "16px", padding: "1.5rem", color: "#fff" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.7, marginBottom: "0.5rem" }}>
              Completed Revenue
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 800 }}>
              Rs {revenue.toLocaleString("en-NP")}
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.65, marginTop: "0.35rem" }}>from completed orders only</div>
          </div>

          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", padding: "1.25rem", flex: 1 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa", marginBottom: "0.75rem" }}>
              Status Breakdown
            </div>
            {orderStats.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "#ccc", margin: 0 }}>No data</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {orderStats.map((s) => (
                  <div key={s.status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <span style={{ color: "#444" }}>{s.status}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: "#1a0a0a" }}>{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Users Tab ──────────────────────────────────────────────────── */
type UserDetail = UserProfile & {
  _listings?: { id: string; title: string; price: number; is_sold: boolean; posted_at: string }[];
  _orders?: { id: string; listing_title: string; total: number; status: string; created_at: string }[];
  _listingCount?: number;
  _orderCount?: number;
};

function UsersTab() {
  const [users, setUsers]               = useState<UserProfile[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState<"all" | "banned" | "admin">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as UserProfile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function openUser(u: UserProfile) {
    if (selectedUser?.id === u.id) { setSelectedUser(null); return; }
    setDetailLoading(true);
    setSelectedUser(u as UserDetail);
    const [{ data: listings }, { data: orders }] = await Promise.all([
      supabase.from("listings").select("id,title,price,is_sold,posted_at").eq("seller_id", u.id).order("posted_at", { ascending: false }).limit(5),
      supabase.from("orders").select("id,listing_title,total,status,created_at").eq("buyer_id", u.id).order("created_at", { ascending: false }).limit(5),
    ]);
    setSelectedUser({
      ...u,
      _listings: (listings as any) ?? [],
      _orders: (orders as any) ?? [],
      _listingCount: listings?.length ?? 0,
      _orderCount: orders?.length ?? 0,
    });
    setDetailLoading(false);
  }

  async function toggleBan(u: UserProfile) {
    setActionLoading(u.id);
    const nb = !u.is_banned;
    // Direct .update() is blocked by RLS — use SECURITY DEFINER RPC instead
    const { error } = await supabase.rpc("admin_ban_user", { p_user_id: u.id, p_is_banned: nb });
    if (!error) {
      await supabase.from("activity_logs").insert({ user_id: u.id, action: nb ? "USER_BANNED" : "USER_UNBANNED", detail: `User ${u.email} was ${nb ? "banned" : "unbanned"} by admin.` });
      setUsers((p) => p.map((x) => x.id === u.id ? { ...x, is_banned: nb } : x));
      if (selectedUser?.id === u.id) setSelectedUser((s) => s ? { ...s, is_banned: nb } : s);
    }
    setActionLoading(null);
  }

  const filtered = users.filter((u) => {
    const ms = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || (filter === "banned" && u.is_banned) || (filter === "admin" && u.is_admin);
    return ms && mf;
  });

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>
          User Management <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#888", marginLeft: "0.4rem" }}>({users.length})</span>
        </h2>
        <button onClick={loadUsers} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fff", border: "1px solid #e8e0d8", borderRadius: "10px", padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "#444", cursor: "pointer" }}>
          <RefreshCw style={{ width: "14px", height: "14px" }} /> Refresh
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "#999" }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", background: "#fff", border: "1px solid #e8e0d8", borderRadius: "10px", padding: "0.6rem 1rem 0.6rem 2.25rem", fontSize: "0.85rem", color: "#1a0a0a", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["all", "banned", "admin"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.6rem 1rem", borderRadius: "10px", border: filter === f ? "none" : "1px solid #e8e0d8", background: filter === f ? "#c0392b" : "#fff", color: filter === f ? "#fff" : "#666", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: selectedUser ? "1fr 360px" : "1fr" }}>
        {/* Table */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", overflow: "hidden" }}>
          <p style={{ margin: "0.6rem 1.25rem", fontSize: "0.72rem", color: "#aaa" }}>Click on a user row to view full details</p>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "#888", gap: "0.5rem" }}>
              <RefreshCw style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} /> Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#888" }}>No users found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#faf8f5", borderBottom: "1px solid #e8e0d8" }}>
                    {["User", "Joined", "Status", "Role", "Action"].map((h) => (
                      <th key={h} style={{ padding: "0.85rem 1.25rem", textAlign: h === "Action" ? "right" : "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr
                      key={u.id}
                      onClick={() => openUser(u)}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid #f0ece6" : "none",
                        opacity: u.is_banned ? 0.7 : 1,
                        cursor: "pointer",
                        background: selectedUser?.id === u.id ? "#fdf5f5" : "#fff",
                        transition: "background 0.12s",
                      }}
                    >
                      {/* User */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #d4a857, #b8872a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, color: "#1a0a0a", flexShrink: 0 }}>
                            {(u.full_name || u.email || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#1a0a0a" }}>{u.full_name || "—"}</div>
                            <div style={{ fontSize: "0.75rem", color: "#888" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Joined */}
                      <td style={{ padding: "1rem 1.25rem", fontSize: "0.78rem", color: "#888" }}>
                        {new Date(u.created_at).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      {/* Status */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        {u.is_banned ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#FEE2E2", color: "#DC2626", borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700 }}>
                            <Ban style={{ width: "11px", height: "11px" }} /> Banned
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#DCFCE7", color: "#16A34A", borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700 }}>
                            <CheckCircle2 style={{ width: "11px", height: "11px" }} /> Active
                          </span>
                        )}
                      </td>
                      {/* Role */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        {u.is_admin ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#FEF3C7", color: "#D97706", borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700 }}>
                            <ShieldCheck style={{ width: "11px", height: "11px" }} /> Admin
                          </span>
                        ) : (
                          <span style={{ background: "#F3EDE5", color: "#888", borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 600 }}>
                            User
                          </span>
                        )}
                      </td>
                      {/* Ban action */}
                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBan(u); }}
                          disabled={actionLoading === u.id}
                          style={{ padding: "0.4rem 0.85rem", borderRadius: "8px", border: "none", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: u.is_banned ? "#DCFCE7" : "#FEE2E2", color: u.is_banned ? "#16A34A" : "#DC2626", opacity: actionLoading === u.id ? 0.5 : 1 }}
                        >
                          {actionLoading === u.id ? "…" : u.is_banned ? "Unban" : "Ban"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User detail panel */}
        {selectedUser && (
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", alignSelf: "start", position: "sticky", top: "80px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.1rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>User Details</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", padding: 0 }}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #d4a857, #b8872a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, color: "#1a0a0a", flexShrink: 0 }}>
                {(selectedUser.full_name || selectedUser.email || "?")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1a0a0a" }}>{selectedUser.full_name || "No name"}</div>
                <div style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.1rem" }}>{selectedUser.email}</div>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  {selectedUser.is_admin && (
                    <span style={{ background: "#FEF3C7", color: "#D97706", borderRadius: "999px", padding: "0.2rem 0.6rem", fontSize: "0.68rem", fontWeight: 700 }}>Admin</span>
                  )}
                  {selectedUser.is_banned && (
                    <span style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: "999px", padding: "0.2rem 0.6rem", fontSize: "0.68rem", fontWeight: 700 }}>Banned</span>
                  )}
                  {!selectedUser.is_admin && !selectedUser.is_banned && (
                    <span style={{ background: "#DCFCE7", color: "#16A34A", borderRadius: "999px", padding: "0.2rem 0.6rem", fontSize: "0.68rem", fontWeight: 700 }}>Active</span>
                  )}
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ background: "#faf8f5", borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem" }}>
              {selectedUser.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Phone style={{ width: "13px", height: "13px", color: "#999", flexShrink: 0 }} />
                  <span style={{ color: "#444" }}>+977-{selectedUser.phone}</span>
                </div>
              )}
              {selectedUser.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin style={{ width: "13px", height: "13px", color: "#999", flexShrink: 0 }} />
                  <span style={{ color: "#444" }}>{selectedUser.location}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock style={{ width: "13px", height: "13px", color: "#999", flexShrink: 0 }} />
                <span style={{ color: "#888" }}>Joined {new Date(selectedUser.created_at).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail style={{ width: "13px", height: "13px", color: "#999", flexShrink: 0 }} />
                <a href={`mailto:${selectedUser.email}`} style={{ color: "#c0392b", textDecoration: "none" }}>{selectedUser.email}</a>
              </div>
            </div>

            {detailLoading ? (
              <div style={{ textAlign: "center", color: "#aaa", fontSize: "0.82rem", padding: "1rem" }}>Loading details…</div>
            ) : (
              <>
                {/* Listings */}
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", marginBottom: "0.6rem" }}>
                    Recent Listings ({selectedUser._listingCount ?? 0})
                  </div>
                  {(selectedUser._listings ?? []).length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "#ccc", margin: 0 }}>No listings</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {(selectedUser._listings ?? []).map((l) => (
                        <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#faf8f5", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}>
                          <span style={{ color: "#444", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                            <span style={{ fontWeight: 700, color: "#c0392b" }}>Rs {l.price.toLocaleString()}</span>
                            {l.is_sold && <span style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: "4px", padding: "0.1rem 0.4rem", fontSize: "0.65rem", fontWeight: 700 }}>SOLD</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Orders */}
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", marginBottom: "0.6rem" }}>
                    Recent Orders ({selectedUser._orderCount ?? 0})
                  </div>
                  {(selectedUser._orders ?? []).length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "#ccc", margin: 0 }}>No orders</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {(selectedUser._orders ?? []).map((o) => (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#faf8f5", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}>
                          <span style={{ color: "#444", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listing_title}</span>
                          <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, alignItems: "center" }}>
                            <span style={{ fontWeight: 700, color: "#c0392b" }}>Rs {o.total.toLocaleString()}</span>
                            <span style={{
                              borderRadius: "4px", padding: "0.1rem 0.4rem", fontSize: "0.65rem", fontWeight: 700,
                              background: o.status === "completed" ? "#DCFCE7" : o.status === "cancelled" ? "#FEE2E2" : "#FEF3C7",
                              color: o.status === "completed" ? "#16A34A" : o.status === "cancelled" ? "#DC2626" : "#D97706",
                            }}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Products Tab ───────────────────────────────────────────────── */
type Listing = {
  id: string;
  title: string;
  category: string;
  price: number;
  condition: string;
  location: string;
  seller_name: string;
  seller_email: string;
  images: string[];
  is_active: boolean;
  is_sold: boolean;
  posted_at: string;
};

function ProductsTab() {
  const [listings, setListings]           = useState<Listing[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState<"all" | "active" | "sold" | "inactive">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError]     = useState("");

  async function loadListings() {
    setLoading(true);
    setActionError("");
    const { data } = await supabase.from("listings").select("*").order("posted_at", { ascending: false });
    setListings((data as Listing[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadListings(); }, []);

  async function toggleSold(l: Listing) {
    setActionLoading(l.id + "-sold");
    setActionError("");
    const { error } = await supabase.rpc("admin_update_listing", { p_id: l.id, p_is_sold: !l.is_sold });
    if (error) setActionError("Failed: " + error.message);
    else setListings(p => p.map(x => x.id === l.id ? { ...x, is_sold: !l.is_sold } : x));
    setActionLoading(null);
  }

  async function toggleActive(l: Listing) {
    setActionLoading(l.id + "-active");
    setActionError("");
    const { error } = await supabase.rpc("admin_update_listing", { p_id: l.id, p_is_active: !l.is_active });
    if (error) setActionError("Failed: " + error.message);
    else setListings(p => p.map(x => x.id === l.id ? { ...x, is_active: !l.is_active } : x));
    setActionLoading(null);
  }

  async function deleteListing(l: Listing) {
    if (!confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
    setActionLoading(l.id + "-del");
    setActionError("");
    const { error } = await supabase.rpc("admin_delete_listing", { p_id: l.id });
    if (error) setActionError("Failed: " + error.message);
    else setListings(p => p.filter(x => x.id !== l.id));
    setActionLoading(null);
  }

  const filtered = listings.filter(l => {
    const ms = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.seller_email?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || (filter === "active" && l.is_active && !l.is_sold) || (filter === "sold" && l.is_sold) || (filter === "inactive" && !l.is_active);
    return ms && mf;
  });

  function fmtPrice(n: number) { return n.toLocaleString("en-NP"); }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>
          Products <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#888", marginLeft: "0.4rem" }}>({listings.length})</span>
        </h2>
        <button onClick={loadListings} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fff", border: "1px solid #e8e0d8", borderRadius: "10px", padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "#444", cursor: "pointer" }}>
          <RefreshCw style={{ width: "14px", height: "14px" }} /> Refresh
        </button>
      </div>

      {actionError && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#DC2626" }}>
          <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} /> {actionError}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "#999" }} />
          <input type="text" placeholder="Search by title or seller…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", background: "#fff", border: "1px solid #e8e0d8", borderRadius: "10px", padding: "0.6rem 1rem 0.6rem 2.25rem", fontSize: "0.85rem", color: "#1a0a0a", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["all", "active", "sold", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.6rem 1rem", borderRadius: "10px", border: filter === f ? "none" : "1px solid #e8e0d8", background: filter === f ? "#c0392b" : "#fff", color: filter === f ? "#fff" : "#666", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "#888", gap: "0.5rem" }}>
            <RefreshCw style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#bbb" }}>
            <Package style={{ width: "40px", height: "40px", margin: "0 auto 0.75rem", display: "block", opacity: 0.3 }} />
            <p style={{ margin: 0 }}>No listings found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#faf8f5", borderBottom: "1px solid #e8e0d8" }}>
                  {["Item", "Category", "Price", "Status", "Seller", "Posted", "Actions"].map(h => (
                    <th key={h} style={{ padding: "0.85rem 1.25rem", textAlign: h === "Actions" ? "right" : "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f0ece6" : "none", opacity: !l.is_active ? 0.5 : 1 }}>
                    {/* Item */}
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {l.images?.[0]
                          ? <img src={l.images[0]} alt="" style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "1px solid #e8e0d8" }} />
                          : <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#f0ece6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Package style={{ width: "18px", height: "18px", color: "#ccc" }} /></div>
                        }
                        <div>
                          <div style={{ fontWeight: 600, color: "#1a0a0a", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                          <div style={{ fontSize: "0.72rem", color: "#999", display: "flex", alignItems: "center", gap: "0.2rem", marginTop: "0.1rem" }}>
                            <MapPin style={{ width: "10px", height: "10px" }} />{l.location} · {l.condition}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td style={{ padding: "0.85rem 1.25rem", fontSize: "0.78rem", color: "#666", textTransform: "capitalize" }}>{l.category}</td>
                    {/* Price */}
                    <td style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: "#c0392b" }}>Rs {fmtPrice(l.price)}</td>
                    {/* Status */}
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      {l.is_sold
                        ? <span style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700 }}>Sold</span>
                        : l.is_active
                          ? <span style={{ background: "#DCFCE7", color: "#16A34A", borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700 }}>Active</span>
                          : <span style={{ background: "#F3EDE5", color: "#888",    borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700 }}>Inactive</span>
                      }
                    </td>
                    {/* Seller */}
                    <td style={{ padding: "0.85rem 1.25rem", fontSize: "0.78rem", color: "#666" }}>
                      <div>{l.seller_name}</div>
                      <div style={{ color: "#aaa" }}>{l.seller_email}</div>
                    </td>
                    {/* Posted */}
                    <td style={{ padding: "0.85rem 1.25rem", fontSize: "0.78rem", color: "#aaa", whiteSpace: "nowrap" }}>
                      {new Date(l.posted_at).toLocaleDateString("en-NP", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        <button onClick={() => toggleSold(l)} disabled={!!actionLoading}
                          style={{ padding: "0.35rem 0.75rem", borderRadius: "8px", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", background: l.is_sold ? "#DCFCE7" : "#FEF3C7", color: l.is_sold ? "#16A34A" : "#D97706", whiteSpace: "nowrap", opacity: actionLoading ? 0.5 : 1 }}>
                          <Tag style={{ width: "11px", height: "11px", display: "inline", marginRight: "0.25rem" }} />
                          {l.is_sold ? "Unmark Sold" : "Mark Sold"}
                        </button>
                        <button onClick={() => toggleActive(l)} disabled={!!actionLoading}
                          style={{ padding: "0.35rem 0.75rem", borderRadius: "8px", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", background: l.is_active ? "#FEE2E2" : "#DCFCE7", color: l.is_active ? "#DC2626" : "#16A34A", whiteSpace: "nowrap", opacity: actionLoading ? 0.5 : 1 }}>
                          {l.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => deleteListing(l)} disabled={!!actionLoading}
                          style={{ padding: "0.35rem 0.6rem", borderRadius: "8px", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", background: "#FEE2E2", color: "#DC2626", opacity: actionLoading ? 0.5 : 1 }}>
                          <Trash2 style={{ width: "13px", height: "13px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Admin Orders Tab ───────────────────────────────────────────── */
type Order = {
  id: string;
  listing_title: string;
  listing_price: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  delivery: string;
  delivery_cost: number;
  delivery_address: string | null;
  payment: string;
  note: string | null;
  total: number;
  status: string;
  created_at: string;
};

function AdminOrdersTab() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [selected, setSelected]     = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setUpdateError("");
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, []);

  async function updateStatus(o: Order, status: string) {
    setUpdatingId(o.id);
    setUpdateError("");
    const { error } = await supabase.rpc("admin_update_order_status", { p_id: o.id, p_status: status });
    if (error) {
      setUpdateError("Update failed: " + error.message);
    } else {
      setOrders(p => p.map(x => x.id === o.id ? { ...x, status } : x));
      if (selected?.id === o.id) setSelected({ ...o, status });
    }
    setUpdatingId(null);
  }

  const filtered = orders.filter(o => filter === "all" || o.status === filter);

  function fmtPrice(n: number) { return n.toLocaleString("en-NP"); }

  const statusStyle: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#FFFBEB", color: "#D97706" },
    confirmed: { bg: "#DBEAFE", color: "#2563EB" },
    completed: { bg: "#DCFCE7", color: "#16A34A" },
    cancelled: { bg: "#FEE2E2", color: "#DC2626" },
  };

  const nextStatus: Record<string, string> = {
    pending:   "confirmed",
    confirmed: "completed",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>
          Orders <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#888", marginLeft: "0.4rem" }}>({orders.length})</span>
        </h2>
        <button onClick={loadOrders} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fff", border: "1px solid #e8e0d8", borderRadius: "10px", padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "#444", cursor: "pointer" }}>
          <RefreshCw style={{ width: "14px", height: "14px" }} /> Refresh
        </button>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: filter === f ? "none" : "1px solid #e8e0d8", background: filter === f ? "#c0392b" : "#fff", color: filter === f ? "#fff" : "#666", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: selected ? "1fr 360px" : "1fr" }}>
        {/* Orders list */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "#888", gap: "0.5rem" }}>
              <RefreshCw style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#bbb" }}>
              <ShoppingCart style={{ width: "40px", height: "40px", margin: "0 auto 0.75rem", display: "block", opacity: 0.3 }} />
              <p style={{ margin: 0 }}>No orders yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#faf8f5", borderBottom: "1px solid #e8e0d8" }}>
                    {["Item", "Buyer", "Total", "Delivery", "Payment", "Status", "Date", ""].map(h => (
                      <th key={h} style={{ padding: "0.85rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => {
                    const ss = statusStyle[o.status] ?? { bg: "#F3EDE5", color: "#888" };
                    return (
                      <tr key={o.id} onClick={() => setSelected(selected?.id === o.id ? null : o)}
                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f0ece6" : "none", cursor: "pointer", background: selected?.id === o.id ? "#fdf5f5" : "#fff", transition: "background 0.12s" }}>
                        <td style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#1a0a0a", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listing_title}</td>
                        <td style={{ padding: "0.85rem 1.25rem" }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a0a0a" }}>{o.buyer_name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#999" }}>{o.buyer_email}</div>
                        </td>
                        <td style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: "#c0392b", whiteSpace: "nowrap" }}>Rs {fmtPrice(o.total)}</td>
                        <td style={{ padding: "0.85rem 1.25rem", fontSize: "0.78rem", color: "#666", textTransform: "capitalize" }}>{o.delivery}</td>
                        <td style={{ padding: "0.85rem 1.25rem", fontSize: "0.78rem", color: "#666", textTransform: "uppercase" }}>{o.payment}</td>
                        <td style={{ padding: "0.85rem 1.25rem" }}>
                          <span style={{ background: ss.bg, color: ss.color, borderRadius: "999px", padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "capitalize" }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1.25rem", fontSize: "0.75rem", color: "#aaa", whiteSpace: "nowrap" }}>
                          {new Date(o.created_at).toLocaleDateString("en-NP", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td style={{ padding: "0.85rem 1.25rem" }}>
                          <Eye style={{ width: "14px", height: "14px", color: "#bbb" }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail pane */}
        {selected && (
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>Order Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {/* Status badge */}
            {(() => {
              const ss = statusStyle[selected.status] ?? { bg: "#F3EDE5", color: "#888" };
              return (
                <span style={{ display: "inline-flex", alignSelf: "flex-start", background: ss.bg, color: ss.color, borderRadius: "999px", padding: "0.35rem 1rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "capitalize" }}>
                  {selected.status}
                </span>
              );
            })()}

            {/* Summary rows */}
            <div style={{ background: "#faf8f5", borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Item</span>
                <span style={{ fontWeight: 600, color: "#1a0a0a", maxWidth: "200px", textAlign: "right" }}>{selected.listing_title}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Buyer</span>
                <span style={{ fontWeight: 600, color: "#1a0a0a" }}>{selected.buyer_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Email</span>
                <a href={`mailto:${selected.buyer_email}`} style={{ color: "#c0392b", textDecoration: "none" }}>{selected.buyer_email}</a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Phone</span>
                <span style={{ fontWeight: 600, color: "#1a0a0a" }}>+977-{selected.buyer_phone}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Delivery</span>
                <span style={{ fontWeight: 600, color: "#1a0a0a", textTransform: "capitalize" }}>{selected.delivery}{selected.delivery_cost > 0 ? ` (+Rs ${selected.delivery_cost})` : " (Free)"}</span>
              </div>
              {selected.delivery_address && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>Address</span>
                  <span style={{ fontWeight: 600, color: "#1a0a0a" }}>{selected.delivery_address}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Payment</span>
                <span style={{ fontWeight: 600, color: "#1a0a0a", textTransform: "uppercase" }}>{selected.payment}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e8e0d8", paddingTop: "0.65rem", marginTop: "0.2rem" }}>
                <span style={{ fontWeight: 700, color: "#1a0a0a" }}>Total</span>
                <span style={{ fontWeight: 800, color: "#c0392b" }}>Rs {fmtPrice(selected.total)}</span>
              </div>
            </div>

            {selected.note && (
              <div style={{ background: "#fffbf0", border: "1px solid #fde68a", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#92400e" }}>
                <span style={{ fontWeight: 700 }}>Note: </span>{selected.note}
              </div>
            )}

            {/* Status actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", margin: 0 }}>Update Status</p>
              {updateError && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.78rem", color: "#DC2626" }}>
                  <AlertCircle style={{ width: "13px", height: "13px", flexShrink: 0 }} /> {updateError}
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {nextStatus[selected.status] && (
                  <button onClick={() => updateStatus(selected, nextStatus[selected.status])} disabled={!!updatingId}
                    style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "#DBEAFE", color: "#2563EB", opacity: updatingId ? 0.5 : 1 }}>
                    Mark {nextStatus[selected.status].charAt(0).toUpperCase() + nextStatus[selected.status].slice(1)}
                  </button>
                )}
                {selected.status !== "cancelled" && selected.status !== "completed" && (
                  <button onClick={() => updateStatus(selected, "cancelled")} disabled={!!updatingId}
                    style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "#FEE2E2", color: "#DC2626", opacity: updatingId ? 0.5 : 1 }}>
                    Cancel Order
                  </button>
                )}
                {selected.status === "cancelled" && (
                  <button onClick={() => updateStatus(selected, "pending")} disabled={!!updatingId}
                    style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "#FFFBEB", color: "#D97706", opacity: updatingId ? 0.5 : 1 }}>
                    Reopen as Pending
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Messages Tab ───────────────────────────────────────────────── */
function MessagesTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase.rpc("admin_get_contact_messages");
    setMessages((data as ContactMessage[]) ?? []);
    setLoading(false);
  }

  async function openMessage(msg: ContactMessage) {
    if (!msg.is_read) {
      // Use RPC — direct update blocked by RLS for non-owners
      await supabase.rpc("admin_mark_message_read", { p_id: msg.id });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: true } : m));
      setSelected({ ...msg, is_read: true });
    } else {
      setSelected(selected?.id === msg.id ? null : msg);
    }
  }

  useEffect(() => { loadMessages(); }, []);

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>
          Contact Messages
          {unread > 0 && (
            <span style={{ marginLeft: "0.5rem", background: "#c0392b", color: "#fff", borderRadius: "999px", padding: "0.15rem 0.65rem", fontSize: "0.72rem", fontWeight: 700 }}>
              {unread} new
            </span>
          )}
        </h2>
        <button onClick={loadMessages} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fff", border: "1px solid #e8e0d8", borderRadius: "10px", padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "#444", cursor: "pointer" }}>
          <RefreshCw style={{ width: "14px", height: "14px" }} /> Refresh
        </button>
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: selected ? "1fr 1.1fr" : "1fr" }}>
        {/* Message list */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "#888", gap: "0.5rem" }}>
              <RefreshCw style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#bbb" }}>
              <Mail style={{ width: "40px", height: "40px", margin: "0 auto 0.75rem", display: "block", opacity: 0.3 }} />
              <p style={{ margin: 0 }}>No messages yet.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "0.75rem",
                  padding: "1rem 1.25rem",
                  borderBottom: i < messages.length - 1 ? "1px solid #f0ece6" : "none",
                  cursor: "pointer",
                  background: selected?.id === msg.id ? "#fdf5f5" : msg.is_read ? "#fff" : "#fffbf0",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ marginTop: "0.2rem", flexShrink: 0 }}>
                  {msg.is_read
                    ? <MailOpen style={{ width: "18px", height: "18px", color: "#ccc" }} />
                    : <Mail style={{ width: "18px", height: "18px", color: "#c0392b" }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: msg.is_read ? 500 : 700, fontSize: "0.875rem", color: "#1a0a0a" }}>{msg.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "#aaa", flexShrink: 0, marginLeft: "0.5rem" }}>
                      {new Date(msg.created_at).toLocaleDateString("en-NP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "#999", marginTop: "0.1rem" }}>{msg.email}</div>
                  <div style={{ fontSize: "0.82rem", color: "#555", marginTop: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {msg.subject || msg.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail pane */}
        {selected && (
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>
                {selected.subject || "No subject"}
              </h3>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ fontSize: "0.82rem", color: "#666" }}>
              <span style={{ fontWeight: 600, color: "#1a0a0a" }}>{selected.name}</span>
              {" · "}
              <a href={`mailto:${selected.email}`} style={{ color: "#c0392b", textDecoration: "none" }}>{selected.email}</a>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#bbb" }}>
              {new Date(selected.created_at).toLocaleString("en-NP")}
            </div>
            <div style={{ background: "#faf8f5", borderRadius: "12px", padding: "1rem", fontSize: "0.875rem", color: "#1a0a0a", lineHeight: 1.75, whiteSpace: "pre-wrap", flex: 1 }}>
              {selected.message}
            </div>
            <a
              href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your message")}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#c0392b", color: "#fff", borderRadius: "999px", padding: "0.6rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}
            >
              <Mail style={{ width: "14px", height: "14px" }} /> Reply via Email
            </a>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

