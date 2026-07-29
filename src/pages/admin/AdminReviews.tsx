import { useEffect, useState } from 'react'
import { Check, X, Star, Trash2, MessageSquare } from 'lucide-react'
import { supabase, type Review } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

type ReviewWithProduct = Review & { product?: { name: string; slug: string } }

export default function AdminReviews() {
  const { showToast } = useToast()
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*, product:products(name, slug)')
      .order('created_at', { ascending: false })
    setReviews((data as ReviewWithProduct[]) ?? [])
    setLoading(false)
  }

  const filtered = reviews.filter((r) => {
    if (filter === 'pending') return !r.is_approved
    if (filter === 'approved') return r.is_approved
    return true
  })

  const approve = async (id: string) => {
    const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
    if (error) { showToast('Failed to approve review', 'error'); return }
    showToast('Review approved!', 'success')
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r)))
  }

  const reject = async (id: string) => {
    const { error } = await supabase.from('reviews').update({ is_approved: false }).eq('id', id)
    if (error) { showToast('Failed to reject review', 'error'); return }
    showToast('Review rejected', 'info')
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: false } : r)))
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) { showToast('Failed to delete review', 'error'); return }
    showToast('Review deleted', 'success')
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const pendingCount = reviews.filter((r) => !r.is_approved).length

  return (
    <div className="section-padding py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-wine-800">Review Moderation</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-1">{pendingCount} review{pendingCount > 1 ? 's' : ''} awaiting approval</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-wine-700 text-cream-50'
                : 'bg-cream-100 text-wine-600 hover:bg-cream-200'
            }`}
          >
            {f === 'pending' ? `Pending (${pendingCount})` : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-cream-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-300'}
                        />
                      ))}
                    </div>
                    {review.is_approved ? (
                      <span className="badge bg-green-100 text-green-700 text-xs">Approved</span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700 text-xs">Pending</span>
                    )}
                  </div>

                  {review.title && <h4 className="font-medium text-wine-800 mb-1">{review.title}</h4>}
                  {review.body && <p className="text-sm text-wine-500 leading-relaxed mb-3">{review.body}</p>}

                  <div className="flex items-center gap-2 text-xs text-wine-400">
                    {review.product && <span className="truncate">Product: {review.product.name}</span>}
                    <span>•</span>
                    <span>{new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {!review.is_approved && (
                    <button
                      onClick={() => approve(review.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      <Check size={16} /> Approve
                    </button>
                  )}
                  {review.is_approved && (
                    <button
                      onClick={() => reject(review.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors text-sm font-medium"
                    >
                      <X size={16} /> Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => remove(review.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MessageSquare size={48} className="text-cream-300 mx-auto mb-4" />
          <p className="text-wine-400">
            {filter === 'pending' ? 'No reviews pending approval.' : filter === 'approved' ? 'No approved reviews.' : 'No reviews yet.'}
          </p>
        </div>
      )}
    </div>
  )
}
