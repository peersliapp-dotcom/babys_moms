import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as unknown as Record<string, Record<string, string>>).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as unknown as Record<string, Record<string, string>>).env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'customer' | 'admin'
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  images: string[]
  tags: string[]
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  category?: Category
  variants?: ProductVariant[]
}

export type ProductVariant = {
  id: string
  product_id: string
  size: string | null
  color: string | null
  sku: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number
  is_active: boolean
  created_at: string
}

export type CartItem = {
  id: string
  user_id: string
  variant_id: string
  quantity: number
  created_at: string
  variant?: ProductVariant & { product?: Product }
}

export type Address = {
  id: string
  user_id: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  district: string
  division: string
  postal_code: string | null
  is_default: boolean
  created_at: string
}

export type Order = {
  id: string
  order_number: string
  user_id: string | null
  guest_email: string | null
  guest_phone: string | null
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_method: 'bkash' | 'nagad' | 'card' | 'cod'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_transaction_id: string | null
  subtotal: number
  discount_amount: number
  shipping_amount: number
  total_amount: number
  coupon_code: string | null
  shipping_address: Record<string, unknown>
  notes: string | null
  courier_name: string | null
  courier_tracking_id: string | null
  courier_consignment_id: string | null
  courier_status: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  variant_id: string | null
  product_name: string
  variant_details: Record<string, unknown> | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export type Review = {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string | null
  body: string | null
  is_verified_purchase: boolean
  is_approved: boolean
  created_at: string
}

export type Coupon = {
  id: string
  code: string
  type: 'percentage' | 'flat' | 'free_shipping'
  value: number
  min_order_amount: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export type Banner = {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  link_url: string | null
  button_text: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type Wishlist = {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

export type SiteSettings = {
  id: string
  logo_url: string | null
  site_name: string
  phone: string
  email: string
  address: string
  instagram_url: string | null
  facebook_url: string | null
  youtube_url: string | null
  twitter_url: string | null
  hero_image_url: string | null
  hero_mobile_image_url: string | null
  pathao_api_key: string | null
  steadfast_api_key: string | null
  courier_provider: string | null
  created_at: string
  updated_at: string
}
