/*
# Site Settings Table + Review Policy Update

## Summary
1. Creates site_settings table for managing logo, contact info, social media links
2. Updates reviews SELECT policy to allow public read of approved reviews (anon)
3. Seeds default settings row

## New Tables
- **site_settings**: Single-row table for global site configuration (logo_url, phone, email, address, social links)

## RLS
- Public read (anon + authenticated)
- Admin write only
*/

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  site_name text DEFAULT 'Baby''s and Mom''s Clothing',
  phone text DEFAULT '+880 1700 000000',
  email text DEFAULT 'hello@babysandmoms.com',
  address text DEFAULT 'Dhaka, Bangladesh',
  instagram_url text,
  facebook_url text,
  youtube_url text,
  twitter_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_read_all" ON public.site_settings;
CREATE POLICY "settings_read_all" ON public.site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_insert" ON public.site_settings;
CREATE POLICY "settings_admin_insert" ON public.site_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "settings_admin_update" ON public.site_settings;
CREATE POLICY "settings_admin_update" ON public.site_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "settings_admin_delete" ON public.site_settings;
CREATE POLICY "settings_admin_delete" ON public.site_settings FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Seed default row
INSERT INTO public.site_settings (logo_url, instagram_url, facebook_url)
VALUES ('/bmlogonew2.png', 'https://instagram.com', 'https://facebook.com')
ON CONFLICT DO NOTHING;

-- Update reviews SELECT to allow anon read of approved reviews
DROP POLICY IF EXISTS "reviews_read_approved" ON public.reviews;
CREATE POLICY "reviews_read_approved" ON public.reviews FOR SELECT
  TO anon, authenticated USING (
    is_approved = true
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Add updated_at trigger for site_settings
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();