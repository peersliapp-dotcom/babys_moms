import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import { type Product } from '../lib/supabase'
import { formatBDT } from '../lib/constants'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useState } from 'react'

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [adding, setAdding] = useState(false)

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
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="badge bg-gold-400 text-white">Featured</span>
          )}
          {hasDiscount && (
            <span className="badge bg-blush-400 text-white">Sale</span>
          )}
          {isLowStock && (
            <span className="badge bg-amber-500 text-white">Low Stock</span>
          )}
          {isOutOfStock && (
            <span className="badge bg-gray-500 text-white">Out of Stock</span>
          )}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); showToast('Added to wishlist!', 'info') }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-blush-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>
        {!isOutOfStock && product.variants?.length === 1 && (
          <button
            onClick={handleQuickAdd}
            disabled={adding}
            className="absolute bottom-3 left-3 right-3 bg-wine-700 text-cream-50 py-2.5 rounded-xl text-sm font-medium hover:bg-wine-800 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShoppingBag size={15} /> {adding ? 'Adding...' : 'Quick Add'}
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-base text-wine-800 line-clamp-1 group-hover:text-blush-500 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-wine-700 font-semibold">{formatBDT(minPrice)}</span>
          {hasDiscount && (
            <span className="text-cream-400 line-through text-sm">{formatBDT(minCompare)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
