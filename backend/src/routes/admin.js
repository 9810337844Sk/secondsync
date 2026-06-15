import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/users ──────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { search, filter } = req.query;

    let query = supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter === "banned") query = query.eq("is_banned", true);
    if (filter === "admin")  query = query.eq("is_admin", true);
    if (search)              query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/users/:id/ban ───────────────────────────
router.patch("/users/:id/ban", async (req, res) => {
  try {
    const { ban } = req.body; // true = ban, false = unban

    const { data: user } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", req.params.id)
      .single();

    await supabaseAdmin
      .from("profiles")
      .update({ is_banned: Boolean(ban) })
      .eq("id", req.params.id);

    await supabaseAdmin.from("activity_logs").insert({
      user_id: req.params.id,
      action:  ban ? "USER_BANNED" : "USER_UNBANNED",
      detail:  `User ${user?.email} was ${ban ? "banned" : "unbanned"} by admin.`,
    });

    res.json({ message: `User ${ban ? "banned" : "unbanned"} successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/users/:id/admin ─────────────────────────
router.patch("/users/:id/admin", async (req, res) => {
  try {
    const { promote } = req.body; // true = make admin, false = revoke

    const { data: user } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", req.params.id)
      .single();

    await supabaseAdmin
      .from("profiles")
      .update({ is_admin: Boolean(promote) })
      .eq("id", req.params.id);

    await supabaseAdmin.from("activity_logs").insert({
      user_id: req.params.id,
      action:  promote ? "ADMIN_GRANTED" : "ADMIN_REVOKED",
      detail:  `Admin rights ${promote ? "granted to" : "revoked from"} ${user?.email}.`,
    });

    res.json({ message: `Admin rights ${promote ? "granted" : "revoked"}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/listings ───────────────────────────────────
router.get("/listings", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*, profiles(full_name, email)")
      .order("posted_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/listings/:id/deactivate ─────────────────
router.patch("/listings/:id/deactivate", async (req, res) => {
  try {
    await supabaseAdmin
      .from("listings")
      .update({ is_active: false })
      .eq("id", req.params.id);

    res.json({ message: "Listing deactivated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/messages ───────────────────────────────────
router.get("/messages", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/messages/:id/read ───────────────────────
router.patch("/messages/:id/read", async (req, res) => {
  try {
    await supabaseAdmin
      .from("contact_messages")
      .update({ is_read: true })
      .eq("id", req.params.id);

    res.json({ message: "Marked as read." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/activity ───────────────────────────────────
router.get("/activity", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("activity_logs")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/stats ──────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: bannedUsers },
      { count: totalListings },
      { count: totalMessages },
      { count: activityEvents },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
      supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("contact_messages").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("activity_logs").select("*", { count: "exact", head: true }),
    ]);

    res.json({ totalUsers, bannedUsers, totalListings, totalMessages, activityEvents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
