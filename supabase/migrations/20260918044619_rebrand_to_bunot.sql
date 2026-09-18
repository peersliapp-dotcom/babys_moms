UPDATE public.site_settings
SET site_name = 'Bunot',
    email = COALESCE(NULLIF(email, 'hello@babysandmoms.com'), 'hello@bunot.com')
WHERE site_name = 'Baby''s and Mom''s Clothing'
   OR email = 'hello@babysandmoms.com';