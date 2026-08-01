import { Link } from 'react-router-dom'
import { Heart, Share2 } from 'lucide-react'
import { type Product } from '../lib/supabase'
import { formatBDT } from '../lib/constants'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useState } from 'react'

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [adding, setAdding] = useState(false)
  const [buying, setBuying] = useState(false)

  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.price))
    : 0
  const minCompare = product.variants?.length
    ? Math.min(...product.variants.filter((v) => v.compare_at_price).map((v) => v.compare_at_price!)) || 0
    : 0
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0
  const isLowStock = totalStock > 0 && totalStock <= 5
  const isOutOfStock = totalStock === 0
  const hasDiscount = minCompare > minPrice

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!product.variants?.length || isOutOfStock) return
    setAdding(true)
    const firstVariant = product.variants[0]
    await addToCart(firstVariant.id, 1)
    showToast('Added to cart!', 'success')
    setAdding(false)
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!product.variants?.length || isOutOfStock) return
    setBuying(true)
    const firstVariant = product.variants[0]
    await addToCart(firstVariant.id, 1)
    window.location.href = '/cart'
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/product/${product.slug}`
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      showToast('Link copied!', 'success')
    }
  }

  const image = product.images?.[0] ?? 'https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg'

  return (
    <Link to={`/product/${product.slug}`} className="card group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-100">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Wishlist — top right corner */}
        <button
          onClick={(e) => { e.preventDefault(); showToast('Added to wishlist!', 'info') }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-blush-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>
        {/* Share — bottom left corner of image */}
        <button
          onClick={handleShare}
          className="absolute bottom-3 left-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-wine-700 hover:text-cream-50 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Share product"
        >
          <Share2 size={15} />
        </button>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-cream-50/40 flex items-center justify-center">
            <span className="bg-wine-700 text-cream-50 px-4 py-1.5 rounded-full text-xs font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-serif text-base text-wine-800 line-clamp-1 group-hover:text-blush-500 transition-colors">
          {product.name}
        </h3>

        {/* Tags row — clean, under image */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {product.is_featured && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gold-100 text-gold-700">Featured</span>
          )}
          {hasDiscount && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blush-100 text-blush-600">Sale</span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Low Stock</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-wine-700 font-semibold">{formatBDT(minPrice)}</span>
          {hasDiscount && (
            <span className="text-cream-400 line-through text-sm">{formatBDT(minCompare)}</span>
          )}
        </div>

        {/* Action buttons — text only, no icons */}
        {!isOutOfStock && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleQuickAdd}
              disabled={adding}
              className="flex-1 bg-cream-100 text-wine-700 py-2.5 rounded-lg text-xs font-medium hover:bg-cream-200 transition-all disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={buying}
              className="flex-1 bg-wine-700 text-cream-50 py-2.5 rounded-lg text-xs font-medium hover:bg-wine-800 transition-all disabled:opacity-50"
            >
              {buying ? '...' : 'Buy Now'}
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}
