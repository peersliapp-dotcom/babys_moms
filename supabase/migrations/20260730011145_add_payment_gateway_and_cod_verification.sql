-- Payment Gateway + COD Verification

-- Add payment gateway fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_gateway text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_gateway_tran_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_gateway_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_verified boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_verified boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_verified_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_verified_by uuid;

-- Add payment gateway settings to site_settings
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS sslcommerz_store_id text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS sslcommerz_store_password text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS bkash_app_key text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS bkash_app_secret text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS bkash_username text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS bkash_password text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS nagad_merchant_id text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS nagad_api_key text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'sandbox';

-- Allow anon to update their own guest orders (for payment callback)
-- The payment callback edge function uses service role, so this is for client-side status checks
DROP POLICY IF EXISTS "orders_guest_select" ON public.orders;
CREATE POLICY "orders_guest_select" ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anon to SELECT order_items (for order confirmation page)
DROP POLICY IF EXISTS "order_items_guest_select" ON public.order_items;
CREATE POLICY "order_items_guest_select" ON public.order_items FOR SELECT
  TO anon, authenticated
  USING (true);