# Project AI Master Blueprint & History Log

## Part 1: Immutable Project Truths
*Do not alter this section unless explicitly ordered by the user.*

### 📋 Original Plan
- **Core Goal**: Build a premium, mobile-first e-commerce platform for "Baby's and Mom's Clothing" — a Bangladesh-based boutique selling baby and maternity/mom apparel online.
- **Target Audience**: New/expecting moms (24–35), mothers with toddlers (25–40), gifting buyers, and moms shopping for themselves. Primarily Bangladesh market, mobile-heavy (70–80% mobile traffic expected).
- **Success Criteria**:
  - Checkout conversion rate ≥ 2.5–3.5%
  - Cart abandonment rate < 65%
  - Page load time < 2.5s on mobile
  - Payment success rate ≥ 95%
  - Repeat purchase rate ≥ 20% within 12 months

### ⚙️ 100% Workflow Design
- **Step 1 (Ingress)**: Customer browses product catalog (Home → Shop → PLP → PDP), adds items to cart, applies coupons, enters shipping address.
- **Step 2 (Processing)**: Checkout validates cart, applies discounts, calculates shipping by Bangladesh district, processes payment (bKash / Nagad / Card / COD).
- **Step 3 (Storage)**: Supabase PostgreSQL stores users, products, variants, categories, orders, cart items, reviews, wishlists, addresses, coupons, banners, site_settings. RLS enforces data isolation.
- **Step 4 (Egress)**: Order confirmation page + email/SMS confirmation. Admin dashboard shows live orders, inventory alerts, and sales reports.

---

## Part 2: Structural Optimization & Architectural Guardrails

### 🚫 Dead Ends & Landmines Avoided
- [x] **Payment keys**: bKash/Nagad/SSLCommerz require merchant registration. Payment UI is fully built but actual money movement requires the business owner to supply API keys. Do not attempt to hardcode or fake live credentials.
- [x] **Supabase CLI**: Not supported in this environment. All migrations use `mcp__supabase__apply_migration` tool only. Never use `npx supabase` or `supabase` CLI.
- [x] **`single()` vs `maybeSingle()`**: Always use `maybeSingle()` for zero-or-one queries to avoid thrown errors on no match.
- [x] **onAuthStateChange deadlock**: Async work inside the callback must be wrapped in `(async () => { ... })()` to avoid deadlock.

### 🎛️ State & Data Schema Context
- **User Object (auth)**: Supabase `auth.users` — `{ id: uuid, email: string }`
- **Profile Object**: `public.profiles` — `{ id: uuid, full_name: text, phone: text, avatar_url: text, role: 'customer' | 'admin' }`
- **Product Object**: `{ id, name, slug, description, category_id, images: text[], is_active, created_at }`
- **Variant Object**: `{ id, product_id, size, color, sku, price, compare_at_price, stock_quantity }`
- **Order Object**: `{ id, user_id, status: 'pending'|'paid'|'processing'|'shipped'|'delivered'|'cancelled', total_amount, payment_method, payment_status, shipping_address (jsonb) }`
- **Site Settings Object**: `{ id, logo_url, site_name, phone, email, address, instagram_url, facebook_url, youtube_url, twitter_url }`
- **Cart**: Persisted in `public.cart_items` for logged-in users; localStorage fallback for guests (merged on login).
- **Global State**: React Context + useState for cart, auth session, and UI state. No external state library (keeping it simple).

### 🗺️ The Perfect Path (The Road to Completion)
- **Current Route**: React + Vite + Tailwind CSS frontend → Supabase backend (PostgreSQL + Auth + RLS)
- **Perfect Short Path**: Single-page React app with React Router for navigation, Supabase client for all data/auth, Tailwind for styling matching the brand palette.
- **Benefit**: No separate backend server needed. Supabase handles auth, database, and RLS policies. Fast to build, easy to maintain, scales automatically.

---

## Part 3: Active Project Status

### ⛓️ Missing Connections Among Completed Parts
- [x] Payment gateway (bKash/Nagad/SSLCommerz) — DONE: Edge function deployed, checkout redirects to gateway, admin settings page for API keys
- [ ] SMS/email notifications — UI shows confirmations, actual send requires SMS gateway API key (SSL Wireless / Alpha SMS)
- [x] Courier API integration (Pathao/Steadfast) — DONE: edge function deployed, manual tracking also supported

### ⚠️ Messy & Redundant Parts (Code Debt)
- [ ] Bundle size slightly over 500KB — could benefit from code splitting in Phase 2

### 🛡️ Loopholes Need to Cover
- [x] Stock quantity must decrement atomically on checkout to prevent overselling — DONE (edge function deployed)
- [x] Guest cart must merge with user cart on login — DONE
- [x] COD orders must be verified before dispatch — DONE (admin verify/reject flow)

### 🔍 What is Missing (Phase 2)
- [x] Bangla language toggle — DONE (LanguageContext with EN/BN translations)
- [x] Admin review moderation page — DONE (dedicated UI for approve/reject/delete)
- [x] Courier live tracking API — DONE (Pathao/Steadfast edge function)
- [x] Stock decrement on checkout — DONE (edge function)
- [x] Payment gateway integration — DONE (bKash/Nagad/SSLCommerz edge function + checkout redirect + admin settings)
- [x] COD order verification before dispatch — DONE (admin verify/reject in orders page)
- [ ] Native mobile app
- [ ] Loyalty points / rewards
- [ ] Live chat AI assistant
- [ ] Email/SMS notification sending

---

## Part 4: Active Session State & AI Alignment

### 📍 Current State
- **Topic**: Feature completion — Session 6
- **Last Topic Covered**: Payment gateway integration (bKash/Nagad/SSLCommerz) + COD order verification.
- **Completed**:
  - Payment gateway edge function deployed (supports bKash, Nagad, SSLCommerz card payments)
  - Checkout page redirects to payment gateway for online methods, COD stays as-is
  - Payment callback handling with success/failure redirect to order confirmation
  - Order confirmation page shows payment status (paid/pending/failed) and COD verification status
  - Admin Orders page: COD verification flow (verify/reject before dispatch), payment status indicators
  - Admin Settings page: payment gateway configuration (sandbox/live mode, API keys for all 3 gateways)
  - Database migration: payment fields on orders, payment settings on site_settings, COD verification columns
  - Product card redesign: tags moved below image, Buy Now button added, share button added
  - Product detail page: professional share modal (WhatsApp, Facebook, Messenger, copy link, native share)
- **Decisions/Next Steps**: SMS notifications, loyalty points, live chat, native mobile app.

### 🎯 AI Execution Confidence Metric
- **Confidence Rating**: 99%
- **Clarity Gaps**: Payment gateway keys remain the primary blocker for live transactions. All other flows are fully functional. Business owner needs to register merchant accounts with bKash, Nagad, and SSLCommerz to get API keys.

### 🗄️ Archived Sessions
<!-- Past sessions append here chronologically -->
**Session 1 — 2026-07-28**: Initial build. Full project scaffolded from PRD. Database migrations applied. Full React frontend built including: Home, Shop/PLP, PDP, Cart, Checkout, Account, Admin Dashboard, static pages.

**Session 2 — 2026-07-28**: Bulk image upload feature added. Product edit form enhanced with variant management (add/edit/delete variants with price, size, color, SKU, stock). Admin dashboard updated with bulk upload link. Storage bucket created for product images.

**Session 3 — 2026-07-28**: Feature completion sprint. Built: Coupon management, Banner management, Site settings (logo/contact/social), Customer list, Working wishlist, Password reset, Review submission, Guest cart merge, Dynamic Navbar/Footer. Database migration for site_settings table + review policy update.

**Session 4 — 2026-07-29**: Bug fixes. Fixed guest checkout (RLS policies for anon order_items), hero image mobile responsiveness + admin upload, contact info sync to About/Contact pages, SPA routing fix (public/_redirects). Added hero_image_url and hero_mobile_image_url columns to site_settings.

**Session 5 — 2026-07-29**: Major feature sprint. Built 6 features: (1) Fixed admin customer list RLS to show all profiles, (2) Improved search with live product suggestions + debounce, (3) Stock decrement edge function on checkout, (4) Admin review moderation page (approve/reject/delete), (5) Courier API integration (Pathao/Steadfast edge function + manual tracking), (6) Bangla language toggle (LanguageContext with EN/BN). Added courier columns to orders table, courier settings to site_settings, review admin policies, profiles admin select policy. Deployed 2 edge functions: decrement-stock, courier-integration.

**Session 6 — 2026-07-30**: Payment gateway + COD verification. Built: (1) Payment gateway edge function supporting bKash, Nagad, and SSLCommerz card payments with sandbox/live mode. (2) Checkout page now redirects to payment gateway for online methods, COD stays as-is. (3) Payment callback handling with success/failure redirect. (4) Order confirmation page shows payment status and COD verification status. (5) Admin Orders page with COD verify/reject flow and payment status indicators. (6) Admin Settings page with payment gateway configuration. (7) Product card redesign: tags below image, Buy Now button, share button. (8) Product detail share modal. Deployed edge function: payment-gateway. Database migration: payment fields on orders, payment settings on site_settings, COD verification columns.
