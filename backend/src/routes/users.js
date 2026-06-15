import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── GET /api/users/me ─────────────────────────────────────────
// Auth required: get own profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    res.json(req.profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/users/me ───────────────────────────────────────
// Auth required: update own profile
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { full_name, phone, location, avatar_url } = req.body;

    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name, phone, location, avatar_url })
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/users/me/listings ────────────────────────────────
// Auth required: get own listings
router.get("/me/listings", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("seller_id", req.user.id)
      .order("posted_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/users/:id ────────────────────────────────────────
// Public: get public profile of any user
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, location, created_at")
      .eq("id", req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: "User not found." });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
