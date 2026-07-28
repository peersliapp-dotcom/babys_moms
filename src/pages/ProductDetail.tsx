import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, ShoppingBag, Truck, RefreshCw, Shield, Minus, Plus, Star, ChevronRight, X } from 'lucide-react'
import { supabase, type Product, type Review } from '../lib/supabase'
import { formatBDT } from '../lib/constants'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import ProductCard from '../components/ProductCard'

export default function ProductDetail() {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const { session } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [adding, setAdding] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()

      if (data) {
        const prod = data as Product
        setProduct(prod)
        if (prod.variants?.length) setSelectedVariant(prod.variants[0].id)

        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', prod.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
        setReviews((reviewData as Review[]) ?? [])

        if (prod.category_id) {
          const { data: relatedData } = await supabase
            .from('products')
            .select('*, category:categories(*), variants:product_variants(*)')
            .eq('is_active', true)
            .eq('category_id', prod.category_id)
            .neq('id', prod.id)
            .limit(4)
          setRelated((relatedData as Product[]) ?? [])
        }

        // Check wishlist
        if (session) {
          const { data: wish } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('product_id', prod.id)
            .maybeSingle()
          setIsWishlisted(!!wish)
        }
      }
      setLoading(false)
    }
    load()
  }, [slug, session])

  const variant = product?.variants?.find((v) => v.id === selectedVariant)
  const isOutOfStock = variant ? variant.stock_quantity === 0 : true
  const isLowStock = variant ? variant.stock_quantity > 0 && variant.stock_quantity <= 5 : false

  const handleAddToCart = async () => {
    if (!selectedVariant) { showToast('Please select a size', 'error'); return }
    setAdding(true)
    await addToCart(selectedVariant, quantity)
    showToast('Added to cart!', 'success')
    setAdding(false)
  }

  const handleBuyNow = async () => {
    if (!selectedVariant) { showToast('Please select a size', 'error'); return }
    await addToCart(selectedVariant, quantity)
    window.location.href = '/cart'
  }

  const handleWishlist = async () => {
    if (!session) { showToast('Please sign in to use wishlist', 'info'); return }
    if (!product) return
    if (isWishlisted) {
      await supabase.from('wishlists').delete().eq('user_id', session.user.id).eq('product_id', product.id)
      setIsWishlisted(false)
      showToast('Removed from wishlist', 'info')
    } else {
      await supabase.from('wishlists').insert({ user_id: session.user.id, product_id: product.id })
      setIsWishlisted(true)
      showToast('Added to wishlist!', 'success')
    }
  }

  const handleSubmitReview = async () => {
    if (!session || !product) return
    if (!reviewForm.body.trim()) { showToast('Please write a review', 'error'); return }
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: session.user.id,
      rating: reviewForm.rating,
      title: reviewForm.title || null,
      body: reviewForm.body,
    })
    if (error) {
      if (error.code === '23505') showToast('You already reviewed this product', 'error')
      else showToast('Failed to submit review', 'error')
    } else {
      showToast('Review submitted! It will appear after approval.', 'success')
      setShowReviewForm(false)
      setReviewForm({ rating: 5, title: '', body: '' })
    }
    setSubmittingReview(false)
  }

  if (loading) {
    return (
      <div className="section-padding py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square rounded-2xl bg-cream-100 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-cream-100 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-cream-100 rounded animate-pulse w-1/4" />
            <div className="h-32 bg-cream-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="section-padding py-20 text-center">
        <h1 className="text-2xl font-serif text-wine-800 mb-4">Product not found</h1>
        <Link to="/shop" className="btn-primary">Back to Shop</Link>
      </div>
    )
  }

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  return (
    <div className="section-padding py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-wine-400 mb-6">
        <Link to="/" className="hover:text-blush-500">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-blush-500">Shop</Link>
        {product.category && (
          <><ChevronRight size={14} /><Link to={`/shop/${product.category.slug}`} className="hover:text-blush-500">{product.category.name}</Link></>
        )}
        <ChevronRight size={14} />
        <span className="text-wine-600 truncate max-w-40">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-cream-100 mb-4">
            <img src={product.images?.[selectedImage] ?? 'https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg'} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${selectedImage === i ? 'border-blush-400' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.is_featured && <span className="badge bg-gold-400 text-white mb-3">Featured</span>}
          <h1 className="text-3xl font-serif text-wine-800 mb-3">{product.name}</h1>

          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.round(avgRating) ? 'fill-gold-400 text-gold-400' : 'text-cream-300'} />
                ))}
              </div>
              <span className="text-sm text-wine-400">({reviews.length} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-semibold text-wine-700">{formatBDT(variant?.price ?? 0)}</span>
            {variant?.compare_at_price && variant.compare_at_price > variant.price && (
              <span className="text-cream-400 line-through text-lg">{formatBDT(variant.compare_at_price)}</span>
            )}
          </div>

          {product.description && <p className="text-wine-600 leading-relaxed mb-6">{product.description}</p>}

          {/* Size Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-wine-800">Select Size</h4>
                <button onClick={() => setShowSizeGuide(true)} className="text-sm text-blush-500 hover:text-blush-600 underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v) => (
                  <button key={v.id} onClick={() => setSelectedVariant(v.id)} disabled={v.stock_quantity === 0}
                    className={`min-w-[3rem] px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      selectedVariant === v.id ? 'border-wine-700 bg-wine-700 text-cream-50'
                      : v.stock_quantity === 0 ? 'border-cream-200 text-cream-300 cursor-not-allowed line-through'
                      : 'border-cream-400 text-wine-700 hover:border-blush-300'
                    }`}>
                    {v.size ?? 'One Size'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isOutOfStock ? <p className="text-red-500 text-sm font-medium mb-4">Out of Stock</p>
          : isLowStock ? <p className="text-amber-600 text-sm font-medium mb-4">Only {variant?.stock_quantity} left in stock!</p> : null}

          {!isOutOfStock && (
            <div className="mb-6">
              <h4 className="font-medium text-wine-800 mb-3">Quantity</h4>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl border border-cream-400 flex items-center justify-center hover:bg-cream-100 transition-colors"><Minus size={16} /></button>
                <span className="w-12 text-center font-medium text-wine-800">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl border border-cream-400 flex items-center justify-center hover:bg-cream-100 transition-colors"><Plus size={16} /></button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button onClick={handleAddToCart} disabled={isOutOfStock || adding} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <ShoppingBag size={18} /> {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button onClick={handleBuyNow} disabled={isOutOfStock} className="btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed">Buy Now</button>
            <button onClick={handleWishlist} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isWishlisted ? 'border-blush-400 bg-blush-100 text-blush-500' : 'border-cream-400 hover:border-blush-400 hover:bg-blush-100 text-wine-600'}`} aria-label="Add to wishlist">
              <Heart size={20} className={isWishlisted ? 'fill-blush-400' : ''} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-t border-cream-200">
            <div className="flex flex-col items-center text-center gap-1.5"><Truck size={20} className="text-wine-600" /><span className="text-xs text-wine-500">Fast Delivery</span></div>
            <div className="flex flex-col items-center text-center gap-1.5"><RefreshCw size={20} className="text-wine-600" /><span className="text-xs text-wine-500">7-Day Returns</span></div>
            <div className="flex flex-col items-center text-center gap-1.5"><Shield size={20} className="text-wine-600" /><span className="text-xs text-wine-500">Safe Fabrics</span></div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-wine-800">Customer Reviews</h2>
          {session && (
            <button onClick={() => setShowReviewForm(true)} className="btn-secondary text-sm">Write a Review</button>
          )}
        </div>
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="card p-5">
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < review.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-300'} />
                  ))}
                </div>
                {review.title && <h4 className="font-medium text-wine-800 mb-1">{review.title}</h4>}
                {review.body && <p className="text-wine-500 text-sm leading-relaxed">{review.body}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-wine-400">No reviews yet. {session ? 'Be the first to review!' : 'Sign in to write a review.'}</p>
          </div>
        )}
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-serif text-wine-800 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSizeGuide(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-cream-50 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-serif text-wine-800 mb-4">Baby Size Guide</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-cream-300">
                <th className="text-left py-2 text-wine-700">Age</th><th className="text-left py-2 text-wine-700">Height (cm)</th>
                <th className="text-left py-2 text-wine-700">Weight (kg)</th><th className="text-left py-2 text-wine-700">Size</th>
              </tr></thead>
              <tbody>
                {[['0–3 months','50–58','3–5','0–3M'],['3–6 months','58–65','5–7','3–6M'],['6–12 months','65–75','7–9','6–12M'],['1–2 years','75–85','9–12','1–2Y'],['2–4 years','85–95','12–15','2–4Y']].map((row) => (
                  <tr key={row[0]} className="border-b border-cream-200">{row.map((cell, i) => <td key={i} className="py-2.5 text-wine-600">{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-wine-400 mt-4">Tip: When in doubt, size up! Babies grow quickly and our fabrics have a comfortable fit.</p>
            <button onClick={() => setShowSizeGuide(false)} className="btn-secondary mt-6 w-full">Got it</button>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowReviewForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-cream-50 rounded-2xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif text-wine-800">Write a Review</h2>
              <button onClick={() => setShowReviewForm(false)} className="text-wine-400"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                      <Star size={28} className={n <= reviewForm.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-300'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Title (optional)</label>
                <input type="text" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} className="input-field" placeholder="Great product!" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Review *</label>
                <textarea value={reviewForm.body} onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })} className="input-field min-h-28 resize-none" placeholder="Share your experience..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmitReview} disabled={submittingReview} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {submittingReview ? <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" /> : 'Submit Review'}
              </button>
              <button onClick={() => setShowReviewForm(false)} className="btn-outline">Cancel</button>
            </div>
            <p className="text-xs text-wine-400 mt-3 text-center">Reviews are moderated and will appear after admin approval.</p>
          </div>
        </div>
      )}
    </div>
  )
}
