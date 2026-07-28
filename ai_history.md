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
- [ ] Payment gateway (bKash/Nagad/SSLCommerz) — UI built, real keys need merchant account from business owner
- [ ] SMS/email notifications — UI shows confirmations, actual send requires SMS gateway API key (SSL Wireless / Alpha SMS)
- [ ] Courier API integration (Pathao/Steadfast) — shipping cost is estimated by district tier, live tracking requires API key

### ⚠️ Messy & Redundant Parts (Code Debt)
- [ ] Bundle size slightly over 500KB — could benefit from code splitting in Phase 2

### 🛡️ Loopholes Need to Cover
- [ ] COD orders need admin verification before dispatch (prevent fake orders)
- [ ] Stock quantity must decrement atomically on checkout to prevent overselling
- [x] Guest cart must merge with user cart on login — DONE

### 🔍 What is Missing (Phase 2)
- [ ] Bangla language toggle
- [ ] Native mobile app
- [ ] Loyalty points / rewards
- [ ] Live chat AI assistant
- [ ] Courier live tracking API
- [ ] Email/SMS notification sending
- [ ] Payment gateway integration (bKash/Nagad/SSLCommerz)
- [ ] Stock decrement on checkout
- [ ] Admin review moderation page (reviews can be approved/rejected via DB)

---

## Part 4: Active Session State & AI Alignment

### 📍 Current State
- **Topic**: Feature completion — Session 3
- **Last Topic Covered**: Built all remaining admin management pages, working wishlist, password reset, review submission, guest cart merge, dynamic site settings.
- **Completed**:
  - Coupon management admin page (CRUD)
  - Banner management admin page (CRUD)
  - Site settings admin page (logo upload, contact info, social media links)
  - Customer list admin page (with order counts and total spent)
  - Working wishlist page (database-backed, add/remove from product page)
  - Password reset flow (email-based reset link)
  - Review submission from product page (star rating, title, body, moderation)
  - Guest cart merge on login (localStorage items merged to server cart)
  - Dynamic Navbar/Footer using site_settings from database
  - Account page wishlist tab shows real wishlist items
- **Decisions/Next Steps**: Payment gateway integration, SMS notifications, stock decrement on checkout, admin review moderation.

### 🎯 AI Execution Confidence Metric
- **Confidence Rating**: 98%
- **Clarity Gaps**: Payment gateway keys remain the primary blocker for live transactions. All other flows are fully functional.

### 🗄️ Archived Sessions
<!-- Past sessions append here chronologically -->
**Session 1 — 2026-07-28**: Initial build. Full project scaffolded from PRD. Database migrations applied. Full React frontend built including: Home, Shop/PLP, PDP, Cart, Checkout, Account, Admin Dashboard, static pages.

**Session 2 — 2026-07-28**: Bulk image upload feature added. Product edit form enhanced with variant management (add/edit/delete variants with price, size, color, SKU, stock). Admin dashboard updated with bulk upload link. Storage bucket created for product images.

**Session 3 — 2026-07-28**: Feature completion sprint. Built: Coupon management, Banner management, Site settings (logo/contact/social), Customer list, Working wishlist, Password reset, Review submission, Guest cart merge, Dynamic Navbar/Footer. Database migration for site_settings table + review policy update.
