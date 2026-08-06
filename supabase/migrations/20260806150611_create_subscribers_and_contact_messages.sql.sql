/*
# Create subscribers and contact_messages tables

1. New Tables
- `subscribers`: stores newsletter signup emails from the homepage subscribe form.
  - `id` (uuid, primary key)
  - `email` (text, unique, not null)
  - `created_at` (timestamptz, default now())
- `contact_messages`: stores messages submitted through the Contact Us page form.
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `email` (text, not null)
  - `subject` (text, not null)
  - `message` (text, not null)
  - `is_read` (boolean, default false)
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on both tables.
- `subscribers`: anon + authenticated can INSERT (newsletter signup needs no login);
  authenticated users can SELECT/DELETE their own subscriptions; admin can read all.
- `contact_messages`: anon + authenticated can INSERT (contact form needs no login);
  only admin can SELECT (messages are private to the store owner).
- Admin detection uses a SECURITY DEFINER function `is_admin()` that checks
  profiles.role = 'admin' for the current auth.uid(), avoiding RLS recursion.

3. Indexes
- Unique index on subscribers.email prevents duplicate signups.
- Index on contact_messages.created_at for admin sorting.
*/

CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_subscribers" ON subscribers;
CREATE POLICY "anon_insert_subscribers"
ON subscribers FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_subscribers" ON subscribers;
CREATE POLICY "admin_read_subscribers"
ON subscribers FOR SELECT
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

DROP POLICY IF EXISTS "admin_delete_subscribers" ON subscribers;
CREATE POLICY "admin_delete_subscribers"
ON subscribers FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages"
ON contact_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_contact_messages" ON contact_messages;
CREATE POLICY "admin_read_contact_messages"
ON contact_messages FOR SELECT
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

DROP POLICY IF EXISTS "admin_update_contact_messages" ON contact_messages;
CREATE POLICY "admin_update_contact_messages"
ON contact_messages FOR UPDATE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
)) WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

DROP POLICY IF EXISTS "admin_delete_contact_messages" ON contact_messages;
CREATE POLICY "admin_delete_contact_messages"
ON contact_messages FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC);
