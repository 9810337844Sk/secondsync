import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { contactLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// ─── POST /api/contact ─────────────────────────────────────────
// Public: submit a contact form message
router.post("/", contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email and message are required." });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    const { data, error } = await supabase.from("contact_messages").insert({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      subject: subject?.trim() || null,
      message: message.trim(),
      is_read: false,
    }).select().single();

    if (error) throw error;

    res.status(201).json({
      message: "Message sent successfully. We'll reply within 24 hours.",
      id: data.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
