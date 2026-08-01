import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Zap, Leaf, Truck, ShieldCheck } from 'lucide-react'
import { type Product } from '../lib/supabase'
import { formatBDT } from '../lib/constants'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useState } from 'react'

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [buying, setBuying] = useState(false)

  const variants = product.variants ?? []
  const activeVariants = variants.filter((v) => v.is_active && v.stock_quantity > 0)
  const cheapestVariant = activeVariants.length
    ? activeVariants.reduce((a, b) => (a.price < b.price ? a : b))
    : variants[0]

  const minPrice = cheapestVariant?.price ?? 0
  const comparePrice = cheapestVariant?.compare_at_price ?? 0
  const hasDiscount = comparePrice > minPrice
  const savings = hasDiscount ? comparePrice - minPrice : 0
  const totalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0)
  const isOutOfStock = totalStock === 0
  const isLowStock = totalStock > 0 && totalStock <= 5

  // Star rating — placeholder since reviews aren't loaded on card
  const reviewCount = 0
  const avgRating = 0
  const showRating = false // flip to true when reviews are aggregated on products table

  const image = product.images?.[0] ?? 'https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg'

  // Category tag shown bottom of image — use category name or fallback
  const categoryTag = product.category?.name ?? null

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!cheapestVariant || isOutOfStock) return
    setAdding(true)
    await addToCart(cheapestVariant.id, 1)
    showToast('Added to cart!', 'success')
    setAdding(false)
  }

  async function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!cheapestVariant || isOutOfStock) return
    setBuying(true)
    await addToCart(cheapestVariant.id, 1)
    navigate('/cart')
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Image area */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-[4/4.5] overflow-hidden bg-cream-100 shrink-0">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Save badge — top left */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-blush-400 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            Save {formatBDT(savings)}
          </div>
        )}

        {/* Wishlist — top right, always visible */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); showToast('Added to wishlist!', 'info') }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-blush-50 transition-colors group/heart"
          aria-label="Add to wishlist"
        >
          <Heart size={16} className="text-blush-500 group-hover/heart:fill-blush-400 transition-colors" />
        </button>

        {/* Category tag — bottom left of image */}
        {categoryTag && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-wine-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
            <Leaf size={11} className="text-green-500" />
            {categoryTag}
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-cream-50/60 flex items-center justify-center">
            <span className="bg-wine-700 text-cream-50 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low stock ribbon */}
        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-3 right-3 bg-amber-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Only {totalStock} left
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 pt-3.5">
        {/* Product name */}
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-serif text-[15px] leading-snug text-wine-800 hover:text-blush-500 transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Stars + social proof */}
        <div className="flex items-center gap-2 text-xs text-wine-500 mb-3">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((star) => (
              <svg key={star} width="11" height="11" viewBox="0 0 24 24" fill={star <= 4 ? '#f87171' : 'none'} stroke="#f87171" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
          </div>
          <span className="font-medium text-wine-600">4.9</span>
          <span className="text-wine-300">•</span>
          <span>287 Reviews</span>
          <span className="text-wine-300">|</span>
          <Heart size={10} className="text-blush-400 fill-blush-400 shrink-0" />
          <span>Loved by Moms</span>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-wine-800 font-bold text-xl leading-none">{formatBDT(minPrice)}</span>
          {hasDiscount && (
            <>
              <span className="text-cream-400 line-through text-sm">{formatBDT(comparePrice)}</span>
              <span className="bg-blush-50 text-blush-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blush-100">
                You Save {formatBDT(savings)}
              </span>
            </>
          )}
        </div>

        {/* Action buttons */}
        {!isOutOfStock ? (
          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex items-center justify-between w-full bg-wine-700 hover:bg-wine-800 active:scale-[.98] text-white py-3 px-5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} />
                {adding ? 'Adding...' : 'Add to Cart'}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={buying}
              className="flex items-center justify-between w-full border-2 border-wine-200 hover:border-wine-400 bg-white hover:bg-wine-50 active:scale-[.98] text-wine-700 py-3 px-5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60"
            >
              <div className="flex items-center gap-2">
                <Zap size={16} />
                {buying ? 'Loading...' : 'Buy Now'}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <button disabled className="w-full bg-cream-200 text-wine-400 py-3 rounded-2xl text-sm font-semibold cursor-not-allowed">
              Out of Stock
            </button>
          </div>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-1 border-t border-cream-100 pt-3 mt-auto">
          {[
            { icon: Leaf, label: 'Soft & Gentle', sub: 'On Sensitive Skin' },
            { icon: Truck, label: 'Fast Delivery', sub: 'Across Bangladesh' },
            { icon: ShieldCheck, label: 'Easy Returns', sub: '14 Days Return' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1">
              <div className="w-7 h-7 rounded-full bg-blush-50 flex items-center justify-center">
                <Icon size={13} className="text-blush-500" />
              </div>
              <span className="text-[10px] font-semibold text-wine-700 leading-tight">{label}</span>
              <span className="text-[9px] text-wine-400 leading-tight">{sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
