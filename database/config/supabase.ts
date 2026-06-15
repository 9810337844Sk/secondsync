// ============================================================
//  Supabase Configuration Reference
//  The actual client used by the app is at: src/lib/supabase.ts
//  This file is for documentation and backend reference only.
// ============================================================

export const SUPABASE_CONFIG = {
  projectUrl:  "https://swxrdjijzvzsrqrrvbdr.supabase.co",
  anonKey:     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eHJkamlqenZ6c3JxcnJ2YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTE0ODgsImV4cCI6MjA5NzA4NzQ4OH0.k5QznDN4GtZsKMOly3j-FpWd3OkN52gtRELt7HIUlU8",
  // serviceRoleKey: stored securely — never expose in frontend
};

// ── Tables ────────────────────────────────────────────────────
export const TABLES = {
  profiles:        "profiles",
  listings:        "listings",
  activityLogs:    "activity_logs",
  contactMessages: "contact_messages",
} as const;

// ── Auth ──────────────────────────────────────────────────────
// Method: Email + Password via Supabase Auth
// Profile auto-created via trigger on auth.users insert
// Admin flag: profiles.is_admin = true
// Ban flag:   profiles.is_banned = true
