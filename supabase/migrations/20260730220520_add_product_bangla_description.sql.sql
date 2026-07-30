/*
# Add Bangla description field to products

1. Modified Tables
- `products`: adds `description_bn` (text, nullable) — stores the Bangla-language product description shown when the site language is set to Bangla.
2. Security
- No new RLS policies needed — the new column is covered by existing product policies.
3. Notes
- The English `description` column is unchanged. When the Bangla description is empty, the frontend will fall back to the English description.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description_bn text;
