import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Public client — uses anon key (respects RLS)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client — uses service role key (bypasses RLS)
// Use ONLY for admin operations on the backend
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
