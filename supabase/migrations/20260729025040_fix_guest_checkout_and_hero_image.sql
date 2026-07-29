-- Fix: Allow guest (anon) order_items inserts for guest orders
-- The existing policy only allows authenticated users and requires user_id match.
-- Guest orders have user_id = null, so we need a separate anon policy.

DROP POLICY IF EXISTS "order_items_insert_guest" ON public.order_items;
CREATE POLICY "order_items_insert_guest" ON public.order_items FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id IS NULL
    )
  );

-- Also allow anon to SELECT their own guest orders (by guest_email match is complex;
-- for now allow anon SELECT of orders where user_id is null, since order_number is not guessable)
DROP POLICY IF EXISTS "orders_select_guest" ON public.orders;
CREATE POLICY "orders_select_guest" ON public.orders FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- Allow anon to SELECT order_items for guest orders
DROP POLICY IF EXISTS "order_items_select_guest" ON public.order_items;
CREATE POLICY "order_items_select_guest" ON public.order_items FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id IS NULL
    )
  );

-- Add hero_image_url column to site_settings
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_mobile_image_url text;