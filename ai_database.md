# Project AI Database Blueprint & Migration Log

## Part 1: Immutably Deployed Schemas

### 🛠️ public.profiles
- **Core Purpose**: Extended user profile data linked to Supabase auth.users. Stores name, phone, role (customer/admin).
- **Schema**:
  ```sql
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer', -- 'customer' | 'admin'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
  ```
- **RLS Policies**:
  - [x] Users can read their own profile (SELECT, authenticated, auth.uid() = id)
  - [x] Users can update their own profile (UPDATE, authenticated, auth.uid() = id)
  - [x] Admins can read all profiles (SELECT, authenticated, role = 'admin')

### 🛠️ public.categories
- **Core Purpose**: Product categories (Baby / Mom) and sub-categories with parent_id hierarchy.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
  ```
- **RLS**: Public read (anon + authenticated). Admin write only.

### 🛠️ public.products
- **Core Purpose**: Master product records. Each product has one or more variants.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  images text[] default '{}',
  tags text[] default '{}',
  is_active boolean default true,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
  ```
- **RLS**: Public read for active products. Admin full CRUD.

### 🛠️ public.product_variants
- **Core Purpose**: Size/color/SKU variants for each product with individual pricing and stock.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text,
  color text,
  sku text unique,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  stock_quantity integer not null default 0,
  is_active boolean default true,
  created_at timestamptz default now()
  ```
- **RLS**: Public read. Admin full CRUD.

### 🛠️ public.cart_items
- **Core Purpose**: Persistent cart for logged-in users. Guest cart uses localStorage.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  unique(user_id, variant_id)
  ```
- **RLS**: Users see/manage only their own cart items.

### 🛠️ public.addresses
- **Core Purpose**: Saved shipping addresses for customers.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  district text not null,
  division text not null,
  postal_code text,
  is_default boolean default false,
  created_at timestamptz default now()
  ```
- **RLS**: Users see/manage only their own addresses.

### 🛠️ public.orders
- **Core Purpose**: Order records with status tracking and payment info.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  guest_email text,
  guest_phone text,
  status text not null default 'pending', -- pending|paid|processing|shipped|delivered|cancelled
  payment_method text not null, -- bkash|nagad|card|cod
  payment_status text not null default 'pending', -- pending|paid|failed|refunded
  payment_transaction_id text,
  subtotal numeric(10,2) not null,
  discount_amount numeric(10,2) default 0,
  shipping_amount numeric(10,2) default 0,
  total_amount numeric(10,2) not null,
  coupon_code text,
  shipping_address jsonb not null,
  notes text,
  courier_name text,
  courier_tracking_id text,
  courier_consignment_id text,
  courier_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
  ```
- **RLS**: Authenticated users see their own orders. Admins see all orders. Guest (anon) can insert/select orders where user_id is null.

### 🛠️ public.order_items
- **Core Purpose**: Line items within each order (product snapshot at time of purchase).
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,
  variant_details jsonb,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  created_at timestamptz default now()
  ```
- **RLS**: Users see items in their own orders. Admins see all.

### 🛠️ public.wishlists
- **Core Purpose**: User wishlist — saved products for later.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
  ```
- **RLS**: Users see/manage only their own wishlist.

### 🛠️ public.reviews
- **Core Purpose**: Product reviews and star ratings from customers.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_verified_purchase boolean default false,
  is_approved boolean default false,
  created_at timestamptz default now(),
  unique(user_id, product_id)
  ```
- **RLS**: Public read (approved only). Authenticated insert (own). Admin full CRUD (select all including unapproved, update for approve/reject, delete).

### 🛠️ public.coupons
- **Core Purpose**: Discount coupon codes with rules (percentage, flat, free shipping, min order).
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null, -- percentage|flat|free_shipping
  value numeric(10,2) not null,
  min_order_amount numeric(10,2) default 0,
  max_uses integer,
  used_count integer default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
  ```
- **RLS**: Public read (active, non-expired). Admin full CRUD.

### 🛠️ public.banners
- **Core Purpose**: Homepage hero banners and promotional banners managed by admin.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  button_text text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
  ```
- **RLS**: Public read. Admin full CRUD.

### 🛠️ public.site_settings
- **Core Purpose**: Global site configuration — logo, contact info, social media links. Single-row table.
- **Schema**:
  ```sql
  id uuid primary key default gen_random_uuid(),
  logo_url text,
  site_name text default 'Baby''s and Mom''s Clothing',
  phone text default '+880 1700 000000',
  email text default 'hello@babysandmoms.com',
  address text default 'Dhaka, Bangladesh',
  instagram_url text,
  facebook_url text,
  youtube_url text,
  twitter_url text,
  hero_image_url text,
  hero_mobile_image_url text,
  pathao_api_key text,
  steadfast_api_key text,
  courier_provider text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
  ```
- **RLS**: Public read (anon + authenticated). Admin write only.

### 🛠️ Storage Bucket: product-images
- **Core Purpose**: Public storage bucket for product images and logo uploads.
- **Policies**: Public read. Admin-only insert/update/delete (checked via profiles.role = 'admin').

---

## Part 2: Chronological Migration File Log

| Step | Migration File Name | Target / Purpose | Status |
| :--- | :--- | :--- | :--- |
| **001** | `create_core_tables` | All core tables: profiles, categories, products, variants, cart, addresses, orders, order_items, wishlists, reviews, coupons, banners. Plus all RLS policies. | **Deployed** ✅ |
| **002** | `seed_categories_and_products` | Seed initial categories (Baby/Mom + sub-categories) and demo products with variants | **Deployed** ✅ |
| **003** | `create_storage_bucket` | Storage bucket `product-images` with public read + admin write policies | **Deployed** ✅ |
| **004** | `create_site_settings_and_review_policy` | site_settings table for logo/contact/social management. Updated reviews SELECT policy for anon read of approved reviews. | **Deployed** ✅ |
| **005** | `fix_guest_checkout_and_hero_image` | Guest checkout RLS fix (anon order_items insert/select). Added hero_image_url + hero_mobile_image_url to site_settings. | **Deployed** ✅ |
| **006** | `fix_customer_list_courier_reviews_policies` | Admin profiles SELECT policy (see all customers). Courier columns on orders. Courier API key columns on site_settings. Review admin policies (select all, update, delete). Orders admin update policy. | **Deployed** ✅ |

---

## Part 3: Pending Changes & Active DB Constraints

- **Next Schema Modification**: Phase 3 will add: `loyalty_points` table, `notifications` table, `translations` table for full i18n, `sms_logs` table.
- **Edge Functions Deployed**:
  - `decrement-stock`: Atomically decrements product variant stock on checkout. Called after order insertion.
  - `courier-integration`: Creates shipments via Pathao/Steadfast API and tracks shipment status. Reads API keys from site_settings.
- **Enforced Architectural Constraints**:
  - Always use `timestamptz` (timestamp with time zone) for all time columns.
  - All foreign keys include explicit cascading rules (`ON DELETE CASCADE` or `SET NULL`).
  - All tables have RLS enabled immediately upon creation.
  - Payment data (transaction IDs, amounts) stored in `orders` table — no raw card data ever touches our database (PCI-DSS compliance handled by payment aggregator).
  - Stock quantity changes must use atomic DB operations (RPC or update with WHERE clause) to prevent race conditions / overselling.
  - `order_number` is a human-readable sequential ID (e.g. BM-001234) generated at insert time.
  - Guest checkout stores address as JSONB in `orders.shipping_address` (no `user_id` required).
