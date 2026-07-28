/*
# Seed Categories and Demo Products

## Summary
Inserts initial product categories (Baby, Mom + sub-categories) and demo products
with variants for testing the full e-commerce flow.

## New Data
1. **Categories**: Baby (parent), Mom (parent), Bodysuits & Rompers, Sleepwear,
   Outfits & Sets, Accessories, Maternity Wear, Nursing Wear, Loungewear (sub-categories)
2. **Products**: 8 demo products across baby and mom categories with images from Pexels
3. **Product Variants**: Multiple size variants per product with pricing and stock
4. **Coupons**: WELCOME10 (10% off), FREESHIP (free shipping)
5. **Banners**: 2 homepage banners

## Important Notes
- All products use Pexels stock photos as placeholders
- Prices are in BDT (Bangladeshi Taka)
- Stock quantities are set for demo purposes
- Idempotent: uses ON CONFLICT to avoid duplicates
*/

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO public.categories (name, slug, description, image_url, sort_order) VALUES
  ('Baby', 'baby', 'Soft, safe clothing for your little ones', 'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg', 1),
  ('Mom', 'mom', 'Comfortable and elegant wear for mothers', 'https://images.pexels.com/photos/3933250/pexels-photo-3933250.jpeg', 2),
  ('Bodysuits & Rompers', 'bodysuits-rompers', 'Soft cotton bodysuits and rompers for babies', 'https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg', 1),
  ('Sleepwear', 'sleepwear', 'Cozy sleepwear for peaceful nights', 'https://images.pexels.com/photos/62689/pexels-photo-62689.jpeg', 2),
  ('Outfits & Sets', 'outfits-sets', 'Matching outfits and sets for any occasion', 'https://images.pexels.com/photos/1620763/pexels-photo-1620763.jpeg', 3),
  ('Accessories', 'accessories', 'Bibs, hats, socks, and mittens', 'https://images.pexels.com/photos/264907/pexels-photo-264907.jpeg', 4),
  ('Maternity Wear', 'maternity-wear', 'Comfortable and stylish maternity clothing', 'https://images.pexels.com/photos/8363905/pexels-photo-8363905.jpeg', 1),
  ('Nursing Wear', 'nursing-wear', 'Practical and beautiful nursing clothing', 'https://images.pexels.com/photos/3933250/pexels-photo-3933250.jpeg', 2),
  ('Loungewear', 'loungewear', 'Relax in comfort and style', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg', 3)
ON CONFLICT (slug) DO NOTHING;

-- Set parent categories
UPDATE public.categories SET parent_id = (SELECT id FROM public.categories WHERE slug = 'baby')
WHERE slug IN ('bodysuits-rompers', 'sleepwear', 'outfits-sets', 'accessories');

UPDATE public.categories SET parent_id = (SELECT id FROM public.categories WHERE slug = 'mom')
WHERE slug IN ('maternity-wear', 'nursing-wear', 'loungewear');

-- ============================================================
-- PRODUCTS (Baby)
-- ============================================================
INSERT INTO public.products (name, slug, description, category_id, images, tags, is_featured, is_active) VALUES
  (
    'Soft Cotton Baby Bodysuit',
    'soft-cotton-baby-bodysuit',
    'Made from 100% organic cotton, this ultra-soft bodysuit is gentle on your baby''s delicate skin. Features easy-snap buttons for quick diaper changes.',
    (SELECT id FROM public.categories WHERE slug = 'bodysuits-rompers'),
    ARRAY['https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg', 'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'],
    ARRAY['organic', 'cotton', 'soft', 'newborn'],
    true, true
  ),
  (
    'Cozy Baby Sleepwear Set',
    'cozy-baby-sleepwear-set',
    'A two-piece sleepwear set designed for maximum comfort. Breathable fabric keeps your baby at the perfect temperature all night.',
    (SELECT id FROM public.categories WHERE slug = 'sleepwear'),
    ARRAY['https://images.pexels.com/photos/62689/pexels-photo-62689.jpeg', 'https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg'],
    ARRAY['sleepwear', 'cozy', 'breathable'],
    true, true
  ),
  (
    'Floral Baby Outfit Set',
    'floral-baby-outfit-set',
    'A beautiful floral print outfit set perfect for special occasions. Includes top and matching pants.',
    (SELECT id FROM public.categories WHERE slug = 'outfits-sets'),
    ARRAY['https://images.pexels.com/photos/1620763/pexels-photo-1620763.jpeg', 'https://images.pexels.com/photos/8363905/pexels-photo-8363905.jpeg'],
    ARRAY['floral', 'outfit', 'occasion'],
    false, true
  ),
  (
    'Baby Bib and Mitten Set',
    'baby-bib-and-mitten-set',
    'A set of 3 soft bibs and 2 pairs of mittens to protect your baby''s clothes and prevent scratching.',
    (SELECT id FROM public.categories WHERE slug = 'accessories'),
    ARRAY['https://images.pexels.com/photos/264907/pexels-photo-264907.jpeg'],
    ARRAY['accessories', 'bibs', 'mittens'],
    false, true
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRODUCTS (Mom)
-- ============================================================
INSERT INTO public.products (name, slug, description, category_id, images, tags, is_featured, is_active) VALUES
  (
    'Elegant Maternity Maxi Dress',
    'elegant-maternity-maxi-dress',
    'A flowing maxi dress designed to grow with your bump. Made from soft, stretchy fabric that adapts to your changing body.',
    (SELECT id FROM public.categories WHERE slug = 'maternity-wear'),
    ARRAY['https://images.pexels.com/photos/8363905/pexels-photo-8363905.jpeg', 'https://images.pexels.com/photos/3933250/pexels-photo-3933250.jpeg'],
    ARRAY['maternity', 'dress', 'elegant'],
    true, true
  ),
  (
    'Comfortable Nursing Top',
    'comfortable-nursing-top',
    'A stylish nursing top with hidden access panels for easy feeding. Soft, breathable cotton blend.',
    (SELECT id FROM public.categories WHERE slug = 'nursing-wear'),
    ARRAY['https://images.pexels.com/photos/3933250/pexels-photo-3933250.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'],
    ARRAY['nursing', 'top', 'comfortable'],
    true, true
  ),
  (
    'Soft Mom Loungewear Set',
    'soft-mom-loungewear-set',
    'Relax in style with this ultra-soft loungewear set. Perfect for home, hospital, or everyday comfort.',
    (SELECT id FROM public.categories WHERE slug = 'loungewear'),
    ARRAY['https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg', 'https://images.pexels.com/photos/8363905/pexels-photo-8363905.jpeg'],
    ARRAY['loungewear', 'comfort', 'relax'],
    false, true
  ),
  (
    'Premium Maternity Kurti',
    'premium-maternity-kurti',
    'A beautiful kurti designed for the Bangladeshi mom. Features side panels that accommodate your growing bump with elegance.',
    (SELECT id FROM public.categories WHERE slug = 'maternity-wear'),
    ARRAY['https://images.pexels.com/photos/8363905/pexels-photo-8363905.jpeg'],
    ARRAY['maternity', 'kurti', 'traditional'],
    true, true
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRODUCT VARIANTS (Baby Products)
-- ============================================================
INSERT INTO public.product_variants (product_id, size, color, sku, price, compare_at_price, stock_quantity, is_active) VALUES
  -- Soft Cotton Baby Bodysuit
  ((SELECT id FROM public.products WHERE slug = 'soft-cotton-baby-bodysuit'), '0-3M', 'White', 'BB-001-WHT-03', 450, 600, 25, true),
  ((SELECT id FROM public.products WHERE slug = 'soft-cotton-baby-bodysuit'), '3-6M', 'White', 'BB-001-WHT-36', 450, 600, 30, true),
  ((SELECT id FROM public.products WHERE slug = 'soft-cotton-baby-bodysuit'), '6-12M', 'Pink', 'BB-001-PNK-612', 450, 600, 15, true),
  ((SELECT id FROM public.products WHERE slug = 'soft-cotton-baby-bodysuit'), '1-2Y', 'Pink', 'BB-001-PNK-12', 450, 600, 3, true),
  -- Cozy Baby Sleepwear Set
  ((SELECT id FROM public.products WHERE slug = 'cozy-baby-sleepwear-set'), '0-3M', 'Blue', 'BB-002-BLU-03', 650, 800, 20, true),
  ((SELECT id FROM public.products WHERE slug = 'cozy-baby-sleepwear-set'), '3-6M', 'Blue', 'BB-002-BLU-36', 650, 800, 18, true),
  ((SELECT id FROM public.products WHERE slug = 'cozy-baby-sleepwear-set'), '6-12M', 'Yellow', 'BB-002-YEL-612', 650, 800, 12, true),
  -- Floral Baby Outfit Set
  ((SELECT id FROM public.products WHERE slug = 'floral-baby-outfit-set'), '6-12M', 'Floral', 'BB-003-FLR-612', 850, 1100, 10, true),
  ((SELECT id FROM public.products WHERE slug = 'floral-baby-outfit-set'), '1-2Y', 'Floral', 'BB-003-FLR-12', 850, 1100, 8, true),
  ((SELECT id FROM public.products WHERE slug = 'floral-baby-outfit-set'), '2-4Y', 'Floral', 'BB-003-FLR-24', 850, 1100, 0, true),
  -- Baby Bib and Mitten Set
  ((SELECT id FROM public.products WHERE slug = 'baby-bib-and-mitten-set'), 'One Size', 'Multi', 'BB-004-MUL', 350, 450, 40, true)
ON CONFLICT (sku) DO NOTHING;

-- ============================================================
-- PRODUCT VARIANTS (Mom Products)
-- ============================================================
INSERT INTO public.product_variants (product_id, size, color, sku, price, compare_at_price, stock_quantity, is_active) VALUES
  -- Elegant Maternity Maxi Dress
  ((SELECT id FROM public.products WHERE slug = 'elegant-maternity-maxi-dress'), 'S', 'Blush', 'MM-001-BLU-S', 1850, 2200, 10, true),
  ((SELECT id FROM public.products WHERE slug = 'elegant-maternity-maxi-dress'), 'M', 'Blush', 'MM-001-BLU-M', 1850, 2200, 15, true),
  ((SELECT id FROM public.products WHERE slug = 'elegant-maternity-maxi-dress'), 'L', 'Maroon', 'MM-001-MAR-L', 1850, 2200, 8, true),
  ((SELECT id FROM public.products WHERE slug = 'elegant-maternity-maxi-dress'), 'XL', 'Maroon', 'MM-001-MAR-XL', 1850, 2200, 5, true),
  -- Comfortable Nursing Top
  ((SELECT id FROM public.products WHERE slug = 'comfortable-nursing-top'), 'S', 'White', 'MM-002-WHT-S', 950, 1200, 20, true),
  ((SELECT id FROM public.products WHERE slug = 'comfortable-nursing-top'), 'M', 'White', 'MM-002-WHT-M', 950, 1200, 25, true),
  ((SELECT id FROM public.products WHERE slug = 'comfortable-nursing-top'), 'L', 'Pink', 'MM-002-PNK-L', 950, 1200, 15, true),
  ((SELECT id FROM public.products WHERE slug = 'comfortable-nursing-top'), 'XL', 'Pink', 'MM-002-PNK-XL', 950, 1200, 4, true),
  -- Soft Mom Loungewear Set
  ((SELECT id FROM public.products WHERE slug = 'soft-mom-loungewear-set'), 'S', 'Cream', 'MM-003-CRM-S', 1450, 1800, 12, true),
  ((SELECT id FROM public.products WHERE slug = 'soft-mom-loungewear-set'), 'M', 'Cream', 'MM-003-CRM-M', 1450, 1800, 14, true),
  ((SELECT id FROM public.products WHERE slug = 'soft-mom-loungewear-set'), 'L', 'Gray', 'MM-003-GRY-L', 1450, 1800, 10, true),
  ((SELECT id FROM public.products WHERE slug = 'soft-mom-loungewear-set'), 'XL', 'Gray', 'MM-003-GRY-XL', 1450, 1800, 6, true),
  -- Premium Maternity Kurti
  ((SELECT id FROM public.products WHERE slug = 'premium-maternity-kurti'), 'S', 'Green', 'MM-004-GRN-S', 1650, 2000, 8, true),
  ((SELECT id FROM public.products WHERE slug = 'premium-maternity-kurti'), 'M', 'Green', 'MM-004-GRN-M', 1650, 2000, 10, true),
  ((SELECT id FROM public.products WHERE slug = 'premium-maternity-kurti'), 'L', 'Maroon', 'MM-004-MAR-L', 1650, 2000, 7, true),
  ((SELECT id FROM public.products WHERE slug = 'premium-maternity-kurti'), 'XL', 'Maroon', 'MM-004-MAR-XL', 1650, 2000, 2, true)
ON CONFLICT (sku) DO NOTHING;

-- ============================================================
-- COUPONS
-- ============================================================
INSERT INTO public.coupons (code, type, value, min_order_amount, max_uses, is_active) VALUES
  ('WELCOME10', 'percentage', 10, 0, 1000, true),
  ('FREESHIP', 'free_shipping', 0, 1500, 500, true),
  ('SAVE200', 'flat', 200, 1000, 200, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- BANNERS
-- ============================================================
INSERT INTO public.banners (title, subtitle, image_url, link_url, button_text, sort_order, is_active) VALUES
  ('New Arrivals', 'Discover our latest collection for baby and mom', 'https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg', '/shop', 'Shop Now', 1, true),
  ('Summer Sale', 'Up to 30% off on selected items', 'https://images.pexels.com/photos/3933250/pexels-photo-3933250.jpeg', '/shop', 'View Deals', 2, true)
ON CONFLICT DO NOTHING;