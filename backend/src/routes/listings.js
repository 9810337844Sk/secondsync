import { Router } from "express";
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── GET /api/listings ─────────────────────────────────────────
// Public: get all active listings with optional filters
router.get("/", async (req, res) => {
  try {
    const { category, condition, sort = "newest", q, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from("listings")
      .select("*")
      .eq("is_active", true)
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (category && category !== "all") query = query.eq("category", category);
    if (condition && condition !== "all") query = query.eq("condition", condition);
    if (q) query = query.ilike("title", `%${q}%`);

    if (sort === "price_asc")  query = query.order("price", { ascending: true });
    if (sort === "price_desc") query = query.order("price", { ascending: false });
    if (sort === "newest")     query = query.order("posted_at", { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ listings: data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/listings/:id ─────────────────────────────────────
// Public: get single listing by id
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*, profiles(full_name, email, phone, location)")
      .eq("id", req.params.id)
      .eq("is_active", true)
      .single();

    if (error || !data) return res.status(404).json({ error: "Listing not found." });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/listings ────────────────────────────────────────
// Auth required: create a new listing
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      title, title_np, category, price, original_price,
      condition, location, phone, description, images,
    } = req.body;

    if (!title || !category || !price || !condition || !location) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    if (!images || images.length === 0) {
      return res.status(400).json({ error: "At least one image is required." });
    }

    const { data, error } = await supabase.from("listings").insert({
      title,
      title_np:       title_np || null,
      category,
      price:          Number(price),
      original_price: original_price ? Number(original_price) : null,
      condition,
      location,
      phone:          phone || null,
      description:    description || null,
      images,
      seller_id:      req.user.id,
      seller_name:    req.profile?.full_name || req.user.email,
      seller_email:   req.user.email,
      is_active:      true,
    }).select().single();

    if (error) throw error;

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: req.user.id,
      action:  "LISTING_CREATED",
      detail:  `Listing "${title}" created by ${req.user.email}.`,
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/listings/:id ───────────────────────────────────
// Auth required: update own listing
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.seller_id;
    delete updates.seller_email;

    const { data, error } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", req.params.id)
      .eq("seller_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Listing not found or not yours." });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/listings/:id ──────────────────────────────────
// Auth required: soft-delete own listing
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("listings")
      .update({ is_active: false })
      .eq("id", req.params.id)
      .eq("seller_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Listing not found or not yours." });

    res.json({ message: "Listing removed successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
