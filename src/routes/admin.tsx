import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, Activity, TrendingUp,
  Ban, CheckCircle2, Search, RefreshCw,
  Eye, Clock, ShieldCheck, Lock, EyeOff, LogOut, Mail, MailOpen,
} from "lucide-react";
import { supabase, type UserProfile } from "@/lib/supabase";
import pattern from "@/assets/pattern.jpg";

const ADMIN_EMAIL    = "teamkalpantrix@gmail.com";
const ADMIN_PASSWORD = "MegaDilasha9090";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Second Sync" }] }),
  component: AdminPage,
});

type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  detail: string;
  created_at: string;
  profiles?: { full_name: string | null; email: string };
};

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
  const [tab, setTab] = useState<"overview" | "users" | "activity" | "messages">("overview");

  const tabs = [
    { id: "overview"  as const, label: "Overview",     icon: TrendingUp },
    { id: "users"     as const, label: "Users",        icon: Users      },
    { id: "messages"  as const, label: "Messages",     icon: Mail       },
    { id: "activity"  as const, label: "Activity Log", icon: Activity   },
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
        {tab === "overview" && <OverviewTab />}
        {tab === "users"    && <UsersTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "activity" && <ActivityTab />}
      </div>
    </div>
  );
}

/* ─── Overview ───────────────────────────────────────────────────── */
function OverviewTab() {
  const [stats, setStats] = useState({ totalUsers: 0, bannedUsers: 0, adminUsers: 0, activityEvents: 0 });

  useEffect(() => {
    async function load() {
      const [{ count: t }, { count: b }, { count: a }, { count: e }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_admin", true),
        supabase.from("activity_logs").select("*", { count: "exact", head: true }),
      ]);
      setStats({ totalUsers: t ?? 0, bannedUsers: b ?? 0, adminUsers: a ?? 0, activityEvents: e ?? 0 });
    }
    load();
  }, []);

  const cards = [
    { icon: Users,      label: "Total Users",      value: stats.totalUsers,      bg: "#EFF6FF", iconBg: "#DBEAFE", iconColor: "#2563EB" },
    { icon: Ban,        label: "Banned Users",      value: stats.bannedUsers,     bg: "#FFF1F1", iconBg: "#FEE2E2", iconColor: "#DC2626" },
    { icon: ShieldCheck,label: "Admin Accounts",   value: stats.adminUsers,      bg: "#FFFBEB", iconBg: "#FEF3C7", iconColor: "#D97706" },
    { icon: Activity,   label: "Activity Events",  value: stats.activityEvents,  bg: "#F0FDF4", iconBg: "#DCFCE7", iconColor: "#16A34A" },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a0a0a", marginBottom: "1.25rem" }}>
        Platform Overview
      </h2>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {cards.map((c) => (
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

      {/* Quick actions */}
      <div style={{ marginTop: "2rem", background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", padding: "1.5rem" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: "#1a0a0a", marginBottom: "1rem" }}>
          Quick Actions
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
          {[
            { label: "Manage Users",   desc: "Ban, unban, promote",   icon: Users    },
            { label: "Activity Logs",  desc: "Full audit trail",      icon: Activity },
            { label: "Live Stats",     desc: "Real-time metrics",     icon: TrendingUp },
          ].map((a) => (
            <div key={a.label} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#faf8f5", borderRadius: "12px", border: "1px solid #e8e0d8", padding: "1rem", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(192,57,43,0.1)", flexShrink: 0 }}>
                <a.icon style={{ width: "16px", height: "16px", color: "#c0392b" }} />
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a0a0a" }}>{a.label}</div>
                <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.15rem" }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Users Tab ──────────────────────────────────────────────────── */
function UsersTab() {
  const [users, setUsers]               = useState<UserProfile[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState<"all" | "banned" | "admin">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as UserProfile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleBan(u: UserProfile) {
    setActionLoading(u.id);
    const nb = !u.is_banned;
    await supabase.from("profiles").update({ is_banned: nb }).eq("id", u.id);
    await supabase.from("activity_logs").insert({ user_id: u.id, action: nb ? "USER_BANNED" : "USER_UNBANNED", detail: `User ${u.email} was ${nb ? "banned" : "unbanned"} by admin.` });
    setUsers((p) => p.map((x) => x.id === u.id ? { ...x, is_banned: nb } : x));
    setActionLoading(null);
  }

  async function toggleAdmin(u: UserProfile) {
    setActionLoading(u.id + "-admin");
    const na = !u.is_admin;
    await supabase.from("profiles").update({ is_admin: na }).eq("id", u.id);
    await supabase.from("activity_logs").insert({ user_id: u.id, action: na ? "ADMIN_GRANTED" : "ADMIN_REVOKED", detail: `Admin rights ${na ? "granted to" : "revoked from"} ${u.email}.` });
    setUsers((p) => p.map((x) => x.id === u.id ? { ...x, is_admin: na } : x));
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

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", overflow: "hidden" }}>
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
                  {["User", "Joined", "Status", "Role", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "0.85rem 1.25rem", textAlign: h === "Actions" ? "right" : "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f0ece6" : "none", opacity: u.is_banned ? 0.6 : 1 }}>
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
                    {/* Actions */}
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => toggleBan(u)}
                          disabled={actionLoading === u.id}
                          style={{ padding: "0.4rem 0.85rem", borderRadius: "8px", border: "none", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: u.is_banned ? "#DCFCE7" : "#FEE2E2", color: u.is_banned ? "#16A34A" : "#DC2626", opacity: actionLoading === u.id ? 0.5 : 1 }}
                        >
                          {actionLoading === u.id ? "…" : u.is_banned ? "Unban" : "Ban"}
                        </button>
                        <button
                          onClick={() => toggleAdmin(u)}
                          disabled={actionLoading === u.id + "-admin"}
                          style={{ padding: "0.4rem 0.85rem", borderRadius: "8px", border: "none", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: u.is_admin ? "#F3EDE5" : "#FEF3C7", color: u.is_admin ? "#888" : "#D97706", opacity: actionLoading === u.id + "-admin" ? 0.5 : 1 }}
                        >
                          {actionLoading === u.id + "-admin" ? "…" : u.is_admin ? "Revoke Admin" : "Make Admin"}
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

/* ─── Messages Tab ───────────────────────────────────────────────── */
function MessagesTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages((data as ContactMessage[]) ?? []);
    setLoading(false);
  }

  async function openMessage(msg: ContactMessage) {
    if (!msg.is_read) {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
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

/* ─── Activity Log ───────────────────────────────────────────────── */
function ActivityTab() {
  const [logs, setLogs]     = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs((data as ActivityLog[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadLogs(); }, []);

  const tagStyle: Record<string, { bg: string; color: string }> = {
    USER_BANNED:     { bg: "#FEE2E2", color: "#DC2626" },
    USER_UNBANNED:   { bg: "#DCFCE7", color: "#16A34A" },
    ADMIN_GRANTED:   { bg: "#FEF3C7", color: "#D97706" },
    ADMIN_REVOKED:   { bg: "#F3EDE5", color: "#888"    },
    USER_SIGNUP:     { bg: "#DBEAFE", color: "#2563EB" },
    USER_LOGIN:      { bg: "#EDE9FE", color: "#7C3AED" },
    LISTING_CREATED: { bg: "#D1FAE5", color: "#059669" },
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1a0a0a", margin: 0 }}>
          Activity Log
        </h2>
        <button onClick={loadLogs} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fff", border: "1px solid #e8e0d8", borderRadius: "10px", padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "#444", cursor: "pointer" }}>
          <RefreshCw style={{ width: "14px", height: "14px" }} /> Refresh
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e0d8", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "#888", gap: "0.5rem" }}>
            <RefreshCw style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} /> Loading activity…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "4rem", textAlign: "center", color: "#bbb" }}>
            <Activity style={{ width: "40px", height: "40px", opacity: 0.35 }} />
            <p style={{ margin: 0 }}>No activity logged yet.</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => {
              const ts = tagStyle[log.action] ?? { bg: "#F3EDE5", color: "#888" };
              return (
                <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem 1.5rem", borderBottom: i < logs.length - 1 ? "1px solid #f0ece6" : "none" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "8px", padding: "0.3rem 0.65rem", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: ts.bg, color: ts.color, flexShrink: 0, marginTop: "0.1rem" }}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#1a0a0a" }}>{log.detail}</p>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem", fontSize: "0.75rem", color: "#999" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Eye style={{ width: "12px", height: "12px" }} />
                        {log.profiles?.full_name || log.profiles?.email || "System"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock style={{ width: "12px", height: "12px" }} />
                        {new Date(log.created_at).toLocaleString("en-NP")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
