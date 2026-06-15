import { supabase, supabaseAdmin } from "../config/supabase.js";

/**
 * Verifies the Supabase JWT from Authorization header.
 * Attaches req.user and req.profile on success.
 */
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  // Fetch profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    return res.status(403).json({ error: "Account suspended." });
  }

  req.user    = user;
  req.profile = profile;
  next();
}

/**
 * Requires the user to be an admin.
 * Must be used after requireAuth.
 */
export function requireAdmin(req, res, next) {
  if (!req.profile?.is_admin) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}
