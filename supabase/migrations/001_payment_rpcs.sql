-- ================================================================
-- SecondSync Payment RPCs
-- Run this once in: Supabase Dashboard → SQL Editor → Run
-- ================================================================

-- Add missing columns to orders table (idempotent)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp text;

-- Drop existing functions so we can change signatures/return types freely
DROP FUNCTION IF EXISTS confirm_order_payment(uuid, uuid);
DROP FUNCTION IF EXISTS cancel_order_payment(uuid, uuid);
DROP FUNCTION IF EXISTS confirm_and_prepare_delivery(uuid, uuid, text);
DROP FUNCTION IF EXISTS verify_delivery_otp(uuid, uuid, text);
DROP FUNCTION IF EXISTS admin_ban_user(uuid, boolean);
DROP FUNCTION IF EXISTS admin_update_listing(uuid, boolean, boolean);
DROP FUNCTION IF EXISTS admin_delete_listing(uuid);
DROP FUNCTION IF EXISTS admin_update_order_status(uuid, text);
DROP FUNCTION IF EXISTS admin_mark_message_read(uuid);

-- ─── confirm_order_payment ───────────────────────────────────────
-- Called after eSewa/Khalti payment verification succeeds.
-- Updates the pending order to "confirmed" and marks the listing sold.
CREATE OR REPLACE FUNCTION confirm_order_payment(
  p_order_id uuid,
  p_buyer_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id     uuid;
  v_current_status text;
BEGIN
  SELECT status, listing_id
  INTO   v_current_status, v_listing_id
  FROM   orders
  WHERE  id = p_order_id AND buyer_id = p_buyer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;

  -- Idempotent: silent success if already confirmed
  IF v_current_status = 'confirmed' THEN
    RETURN;
  END IF;

  IF v_current_status != 'pending' THEN
    RAISE EXCEPTION 'Order already processed: status=%', v_current_status;
  END IF;

  UPDATE orders
  SET    status     = 'confirmed',
         updated_at = now()
  WHERE  id = p_order_id AND buyer_id = p_buyer_id;

  -- Hide the listing immediately so no one else can purchase it
  IF v_listing_id IS NOT NULL THEN
    UPDATE listings SET is_active = false WHERE id = v_listing_id;
  END IF;
END;
$$;

-- ─── cancel_order_payment ────────────────────────────────────────
-- Called when user cancels or eSewa/Khalti redirects to failure_url.
CREATE OR REPLACE FUNCTION cancel_order_payment(
  p_order_id uuid,
  p_buyer_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orders
  SET    status     = 'cancelled',
         updated_at = now()
  WHERE  id       = p_order_id
    AND  buyer_id = p_buyer_id
    AND  status   = 'pending';
END;
$$;

-- ─── confirm_and_prepare_delivery ───────────────────────────────
-- Stores the 6-digit escrow OTP and returns order + seller data
-- needed by the email notification.
CREATE OR REPLACE FUNCTION confirm_and_prepare_delivery(
  p_order_id uuid,
  p_buyer_id uuid,
  p_otp      text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  UPDATE orders
  SET    delivery_otp = p_otp
  WHERE  id = p_order_id AND buyer_id = p_buyer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT json_build_object(
    'listing_title',    o.listing_title,
    'buyer_name',       o.buyer_name,
    'buyer_phone',      o.buyer_phone,
    'buyer_email',      o.buyer_email,
    'delivery',         o.delivery,
    'delivery_address', o.delivery_address,
    'payment',          o.payment,
    'total',            o.total,
    'note',             o.note,
    'seller_email',     COALESCE(p.email, '')
  )
  INTO v_result
  FROM orders o
  LEFT JOIN profiles p ON p.id = o.seller_id
  WHERE o.id = p_order_id;

  RETURN v_result;
END;
$$;

-- ─── verify_delivery_otp ────────────────────────────────────────
-- Seller enters buyer's 6-digit OTP to confirm delivery and complete the order.
CREATE OR REPLACE FUNCTION verify_delivery_otp(
  p_order_id  uuid,
  p_seller_id uuid,
  p_otp       text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_otp text;
  v_status     text;
  v_listing_id uuid;
BEGIN
  SELECT delivery_otp, status, listing_id
  INTO   v_stored_otp, v_status, v_listing_id
  FROM   orders
  WHERE  id = p_order_id AND seller_id = p_seller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_status = 'completed' THEN RETURN; END IF;  -- idempotent

  IF v_status != 'confirmed' THEN
    RAISE EXCEPTION 'Order is not in a confirmable state: %', v_status;
  END IF;

  IF v_stored_otp IS NULL OR v_stored_otp != p_otp THEN
    RAISE EXCEPTION 'Invalid OTP';
  END IF;

  UPDATE orders
  SET    status = 'completed', updated_at = now()
  WHERE  id = p_order_id AND seller_id = p_seller_id;

  -- Permanently hide the listing from browse (is_active=false removes it from all queries)
  IF v_listing_id IS NOT NULL THEN
    UPDATE listings SET is_active = false WHERE id = v_listing_id;
  END IF;
END;
$$;

-- ─── admin_ban_user ──────────────────────────────────────────────
-- SECURITY DEFINER so RLS doesn't block the admin from updating
-- another user's profile row.
CREATE OR REPLACE FUNCTION admin_ban_user(
  p_user_id   uuid,
  p_is_banned boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET    is_banned = p_is_banned
  WHERE  id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- ─── Grant permissions ───────────────────────────────────────────
GRANT EXECUTE ON FUNCTION confirm_order_payment(uuid, uuid)              TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION cancel_order_payment(uuid, uuid)               TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION confirm_and_prepare_delivery(uuid, uuid, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION verify_delivery_otp(uuid, uuid, text)          TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION admin_ban_user(uuid, boolean)                  TO authenticated, anon, service_role;

-- ─── admin_update_listing ────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_listing(
  p_id        uuid,
  p_is_active boolean DEFAULT NULL,
  p_is_sold   boolean DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE listings
  SET
    is_active = COALESCE(p_is_active, is_active),
    is_sold   = COALESCE(p_is_sold,   is_sold)
  WHERE id = p_id;
END; $$;

-- ─── admin_delete_listing ────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_delete_listing(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM listings WHERE id = p_id;
END; $$;

-- ─── admin_update_order_status ───────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_order_status(p_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE orders SET status = p_status, updated_at = now() WHERE id = p_id;
END; $$;

-- ─── admin_mark_message_read ─────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_mark_message_read(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE contact_messages SET is_read = true WHERE id = p_id;
END; $$;

GRANT EXECUTE ON FUNCTION admin_update_listing(uuid, boolean, boolean) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION admin_delete_listing(uuid)                    TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION admin_update_order_status(uuid, text)         TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION admin_mark_message_read(uuid)                 TO authenticated, anon, service_role;

-- ─── Enable Realtime on orders ───────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ================================================================
-- NOTIFICATIONS
-- ================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text        NOT NULL,
  type       text        NOT NULL,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: users can only see/update their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_notifications"   ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_read_own_notifications"   ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Trigger: new order → notify seller
CREATE OR REPLACE FUNCTION _notify_order_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type)
  VALUES (
    NEW.seller_id,
    'New order received!',
    NEW.buyer_name || ' ordered "' || NEW.listing_title || '" — Rs ' || NEW.total,
    'order_new'
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_order_insert ON orders;
CREATE TRIGGER trg_notify_order_insert
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION _notify_order_insert();

-- Trigger: order status changes → notify buyer + seller
CREATE OR REPLACE FUNCTION _notify_order_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status = 'confirmed' THEN
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (
      NEW.buyer_id,
      'Your order is confirmed!',
      'Payment for "' || NEW.listing_title || '" has been confirmed. Keep your delivery code ready.',
      'order_confirmed'
    );
  END IF;

  IF NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, title, body, type)
    VALUES
      (NEW.buyer_id,  'Delivery confirmed!',  '"' || NEW.listing_title || '" has been delivered. Enjoy!', 'order_completed'),
      (NEW.seller_id, 'Your item is sold!',   '"' || NEW.listing_title || '" delivered & transaction complete.', 'sale_completed');
  END IF;

  IF NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (
      NEW.seller_id,
      'Order cancelled',
      'The order for "' || NEW.listing_title || '" was cancelled.',
      'order_cancelled'
    );
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_order_update ON orders;
CREATE TRIGGER trg_notify_order_update
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION _notify_order_update();

-- Enable Realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─── admin_get_contact_messages ──────────────────────────────────
-- SECURITY DEFINER so the admin panel (anon client) can read messages
-- without needing Supabase auth session.
DROP FUNCTION IF EXISTS admin_get_contact_messages();
CREATE OR REPLACE FUNCTION admin_get_contact_messages()
RETURNS TABLE (
  id         uuid,
  name       text,
  email      text,
  subject    text,
  message    text,
  is_read    boolean,
  created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
    SELECT cm.id, cm.name, cm.email, cm.subject, cm.message, cm.is_read, cm.created_at
    FROM contact_messages cm
    ORDER BY cm.created_at DESC;
END; $$;

GRANT EXECUTE ON FUNCTION admin_get_contact_messages() TO authenticated, anon, service_role;
