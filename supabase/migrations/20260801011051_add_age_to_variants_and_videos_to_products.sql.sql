/*
# Add age to product variants and video URLs to products

1. New Columns
- `product_variants.age` (text, nullable) — age range for the variant (e.g. "0-3 months", "1-2 years"). Used for age filtering in the shop.
- `products.videos` (text[] default '{}') — array of embedded video URLs (YouTube/Facebook) for the product.

2. Security
- No new tables. Existing RLS policies on product_variants and products remain unchanged.
- Both columns are readable by anon/authenticated (inherited from existing SELECT policies).

3. Notes
- `age` is nullable so existing variants are unaffected.
- `videos` defaults to an empty array so existing products are unaffected.
- Both columns are safe to add without data loss.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'age'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN age text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'videos'
  ) THEN
    ALTER TABLE products ADD COLUMN videos text[] DEFAULT '{}' NOT NULL;
  END IF;
END $$;
