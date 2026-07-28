import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, Tag, Truck } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { formatBDT, FREE_SHIPPING_THRESHOLD } from '../lib/constants'
import { useState } from 'react'
import { supabase, type Coupon } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

export default function Cart() {
  const { items, subtotal, updateQuantity, removeFromCart, loading } = useCart()
  const { showToast } = useToast()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [applying, setApplying] = useState(false)

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setApplying(true)
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      showToast('Invalid coupon code', 'error')
      setDiscount(0)
      setCoupon(null)
    } else {
      const c = data as Coupon
      if (c.min_order_amount && subtotal < c.min_order_amount) {
        showToast(`Minimum order of ${formatBDT(c.min_order_amount)} required`, 'error')
        setDiscount(0)
        setCoupon(null)
      } else if (c.expires_at && new Date(c.expires_at) < new Date()) {
        showToast('This coupon has expired', 'error')
        setDiscount(0)
        setCoupon(null)
      } else {
        let disc = 0
        if (c.type === 'percentage') {
          disc = (subtotal * c.value) / 100
        } else if (c.type === 'flat') {
          disc = c.value
        }
        setDiscount(disc)
        setCoupon(c)
        showToast(`Coupon applied! You saved ${formatBDT(disc)}`, 'success')
      }
    }
    setApplying(false)
  }

  const total = subtotal - discount

  if (loading) {
    return (
      <div className="section-padding py-20 text-center">
        <div className="w-8 h-8 border-2 border-blush-300 border-t-wine-700 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="section-padding py-20 text-center animate-fade-in">
        <ShoppingBag size={64} className="text-cream-300 mx-auto mb-6" />
        <h1 className="text-2xl font-serif text-wine-800 mb-3">Your cart is empty</h1>
        <p className="text-wine-400 mb-8">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn-primary">Start Shopping</Link>
      </div>
    )
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {remainingForFreeShipping > 0 ? (
            <div className="bg-blush-50 border border-blush-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-wine-600 flex items-center gap-2">
                <Truck size={16} /> Add {formatBDT(remainingForFreeShipping)} more for free shipping!
              </p>
              <div className="mt-2 h-2 bg-cream-200 rounded-full overflow-hidden">
                <div className="h-full bg-blush-400 rounded-full transition-all duration-500" style={{ width: `${freeShippingProgress}%` }} />
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <Truck size={16} /> You've unlocked free shipping!
              </p>
            </div>
          )}

          {items.map((item) => {
            const variant = 'variant' in item ? item.variant : undefined
            if (!variant) return null
            const product = variant.product
            const image = product?.images?.[0] ?? 'https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg'

            return (
              <div key={(item as { id?: string }).id ?? item.variant_id} className="card p-4 flex gap-4">
                <Link to={`/product/${product?.slug ?? ''}`} className="shrink-0">
                  <img src={image} alt={product?.name ?? ''} className="w-24 h-24 rounded-xl object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${product?.slug ?? ''}`}>
                    <h3 className="font-serif text-wine-800 hover:text-blush-500 transition-colors line-clamp-1">{product?.name ?? ''}</h3>
                  </Link>
                  <p className="text-sm text-wine-400 mt-0.5">
                    {variant.size && `Size: ${variant.size}`}
                    {variant.size && variant.color && ' · '}
                    {variant.color && `Color: ${variant.color}`}
                  </p>
                  <p className="text-wine-700 font-semibold mt-1">{formatBDT(variant.price)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-cream-400 flex items-center justify-center hover:bg-cream-100 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-cream-400 flex items-center justify-center hover:bg-cream-100 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variant_id)}
                      className="text-wine-400 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-serif text-wine-800 mb-4">Order Summary</h2>

            {/* Coupon */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cream-400 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
                  />
                </div>
                <button
                  onClick={applyCoupon}
                  disabled={applying}
                  className="px-4 py-2.5 rounded-xl bg-wine-700 text-cream-50 text-sm font-medium hover:bg-wine-800 transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {coupon && (
                <p className="text-xs text-green-600 mt-1.5">Coupon "{coupon.code}" applied</p>
              )}
            </div>

            <div className="space-y-2 text-sm border-t border-cream-200 pt-4">
              <div className="flex justify-between text-wine-600">
                <span>Subtotal</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatBDT(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-wine-600">
                <span>Shipping</span>
                <span className="text-wine-400">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-semibold text-wine-800 border-t border-cream-200 pt-4 mt-4">
              <span>Total</span>
              <span>{formatBDT(total)}</span>
            </div>

            <Link
              to="/checkout"
              state={{ discount, couponCode: coupon?.code ?? null }}
              className="btn-primary w-full mt-6 text-center flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ShoppingBag size={18} />
            </Link>

            <Link to="/shop" className="block text-center text-sm text-wine-500 hover:text-blush-500 mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
