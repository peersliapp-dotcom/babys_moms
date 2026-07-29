-- Fix: Allow admin to SELECT all profiles (for customer list)
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Allow admin to count all profiles (already covered by select_admin above)

-- Add courier tracking columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_tracking_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_consignment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_status text;

-- Add courier API settings to site_settings
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS pathao_api_key text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS steadfast_api_key text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS courier_provider text DEFAULT 'manual';

-- Allow admin to UPDATE reviews (approve/reject)
DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
CREATE POLICY "reviews_admin_update" ON public.reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow admin to SELECT all reviews (including unapproved)
DROP POLICY IF EXISTS "reviews_admin_select" ON public.reviews;
CREATE POLICY "reviews_admin_select" ON public.reviews FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_approved = true
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow admin to DELETE reviews
DROP POLICY IF EXISTS "reviews_admin_delete" ON public.reviews;
CREATE POLICY "reviews_admin_delete" ON public.reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow admin to UPDATE orders (for courier info) - extend existing
DROP POLICY IF EXISTS "orders_admin_update_courier" ON public.orders;
CREATE POLICY "orders_admin_update_courier" ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );