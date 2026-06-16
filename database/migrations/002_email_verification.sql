-- ============================================================
-- Second Sync: Email Verification System
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add is_verified column to profiles (defaults to false)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS — no direct client access (SECURITY DEFINER functions handle all access)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS no_direct_access ON verification_codes;
CREATE POLICY no_direct_access ON verification_codes USING (false);

-- 3. Function: store a new verification code for an email
--    Called by the server function after sending the email.
CREATE OR REPLACE FUNCTION store_verification_code(p_email text, p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete any existing codes for this email first
  DELETE FROM verification_codes WHERE email = p_email;
  -- Insert the new code with a 15-minute expiry
  INSERT INTO verification_codes (email, code, expires_at)
  VALUES (p_email, p_code, NOW() + INTERVAL '15 minutes');
END;
$$;

-- 4. Function: verify the code, mark email as confirmed, set is_verified
--    Called from the client-side verify page with the anon key.
CREATE OR REPLACE FUNCTION verify_email_code(p_email text, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT * INTO v_rec
  FROM verification_codes
  WHERE email      = p_email
    AND code       = p_code
    AND used       = FALSE
    AND expires_at > NOW()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Mark code as used
  UPDATE verification_codes SET used = TRUE WHERE id = v_rec.id;

  -- Mark profile as verified
  UPDATE profiles SET is_verified = TRUE WHERE email = p_email;

  -- Also confirm the Supabase auth user (so signInWithPassword works)
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE email = p_email;

  RETURN TRUE;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION store_verification_code(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_email_code(text, text) TO anon, authenticated;
