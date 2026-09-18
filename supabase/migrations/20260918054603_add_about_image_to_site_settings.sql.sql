ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_image_url text;
