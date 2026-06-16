import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://swxrdjijzvzsrqrrvbdr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eHJkamlqenZ6c3JxcnJ2YmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTE0ODgsImV4cCI6MjA5NzA4NzQ4OH0.k5QznDN4GtZsKMOly3j-FpWd3OkN52gtRELt7HIUlU8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  is_banned: boolean;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
};
