-- ============================================================
--  Second Sync — RLS Policies Reference
--  This file documents all Row Level Security policies.
--  These are already included in schema.sql — this is for reference only.
-- ============================================================

-- ── PROFILES ──────────────────────────────────────────────────
-- Anyone can read profiles (needed for seller info on listings)
-- Users can insert their own profile
-- Users can update their own profile
-- Admins can update any profile (ban/unban/promote)

-- ── LISTINGS ──────────────────────────────────────────────────
-- Anyone (including anon) can read active listings
-- Any signed-in, non-banned user can post a listing
-- Sellers can update/delete their own listings
-- Admins have full access to all listings

-- ── ACTIVITY LOGS ─────────────────────────────────────────────
-- Only admins can read logs
-- Any signed-in user can insert a log entry

-- ── CONTACT MESSAGES ──────────────────────────────────────────
-- Anyone (public form) can insert a message
-- Only admins can read messages
-- Only admins can update messages (mark as read)

-- ── SUMMARY TABLE ─────────────────────────────────────────────
-- Table              | anon SELECT | auth INSERT | auth UPDATE | auth DELETE | admin ALL
-- profiles           | ✅           | own only    | own only    | ❌           | ✅
-- listings           | active only  | seller_id   | own only    | own only    | ✅
-- activity_logs      | ❌           | ✅           | ❌           | ❌           | ✅
-- contact_messages   | ❌           | ✅           | ❌           | ❌           | ✅
