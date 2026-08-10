import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Search, Upload, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, type Product, type Category, type ProductVariant } from '../../lib/supabase'
import { formatBDT } from '../../lib/constants'
import { useToast } from '../../contexts/ToastContext'
import ImageUploader from '../../components/ImageUploader'

type VariantDraft = {
  id?: string
  size: string
  color: string
  age: string
  sku: string
  price: string
  compare_at_price: string
  stock_quantity: string
  is_active: boolean
  _deleted?: boolean
}

export default function AdminProducts() {
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [variants, setVariants] = useState<VariantDraft[]>([])
  const [variantsExpanded, setVariantsExpanded] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    description_bn: '',
    category_id: '',
    images: [] as string[],
    imageUrls: '',
    videos: '',
    is_featured: false,
    is_active: true,
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*), variants:product_variants(*)')
      .order('created_at', { ascending: false })
    setProducts((data as Product[]) ?? [])

    const { data: catData } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
    setCategories((catData as Category[]) ?? [])
    setLoading(false)
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', description_bn: '', category_id: '', images: [], imageUrls: '', videos: '', is_featured: false, is_active: true })
    setVariants([])
    setVariantsExpanded(false)
    setShowForm(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      description_bn: product.description_bn ?? '',
      category_id: product.category_id ?? '',
      images: product.images ?? [],
      imageUrls: '',
      videos: product.videos?.join('\n') ?? '',
      is_featured: product.is_featured,
      is_active: product.is_active,
    })
    setVariants(
      (product.variants ?? []).map((v: ProductVariant) => ({
        id: v.id,
        size: v.size ?? '',
        color: v.color ?? '',
        age: v.age ?? '',
        sku: v.sku ?? '',
        price: String(v.price),
        compare_at_price: v.compare_at_price ? String(v.compare_at_price) : '',
        stock_quantity: String(v.stock_quantity),
        is_active: v.is_active,
      }))
    )
    setVariantsExpanded(false)
    setShowForm(true)
  }

  const addVariant = () => {
    setVariants([
      ...variants,
      { size: '', color: '', age: '', sku: '', price: '', compare_at_price: '', stock_quantity: '0', is_active: true },
    ])
    setVariantsExpanded(true)
  }

  const updateVariant = (index: number, field: keyof VariantDraft, value: string | boolean) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  const removeVariant = (index: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? (v.id ? { ...v, _deleted: true } : { ...v, _deleted: true }) : v))
    )
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      showToast('Name and slug are required', 'error')
      return
    }

    const allImages = [
      ...form.images,
      ...form.imageUrls.split('\n').map((s) => s.trim()).filter(Boolean),
    ]

    const productData = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      description_bn: form.description_bn || null,
      category_id: form.category_id || null,
      images: allImages,
      videos: form.videos.split('\n').map((s) => s.trim()).filter(Boolean),
      is_featured: form.is_featured,
      is_active: form.is_active,
    }

    let productId: string

    if (editing) {
      const { error } = await supabase.from('products').update(productData).eq('id', editing.id)
      if (error) {
        showToast('Failed to update product', 'error')
        return
      }
      productId = editing.id
    } else {
      const { data, error } = await supabase.from('products').insert(productData).select('id').single()
      if (error) {
        showToast('Failed to create product', 'error')
        return
      }
      productId = data.id
    }

    // Save variants
    for (const v of variants) {
      if (v._deleted && v.id) {
        await supabase.from('product_variants').delete().eq('id', v.id)
        continue
      }
      if (v._deleted) continue
      if (!v.price.trim()) continue

      const variantData = {
        product_id: productId,
        size: v.size || null,
        color: v.color || null,
        age: v.age || null,
        sku: v.sku || null,
        price: parseFloat(v.price) || 0,
        compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        stock_quantity: parseInt(v.stock_quantity) || 0,
        is_active: v.is_active,
      }

      if (v.id) {
        await supabase.from('product_variants').update(variantData).eq('id', v.id)
      } else {
        await supabase.from('product_variants').insert(variantData)
      }
    }

    showToast(editing ? 'Product updated!' : 'Product created!', 'success')
    setShowForm(false)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) showToast('Failed to delete product', 'error')
    else { showToast('Product deleted', 'success'); await load() }
  }

  const activeVariants = variants.filter((v) => !v._deleted)

  return (
    <div className="section-padding py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-serif text-wine-800">Products</h1>
        <div className="flex gap-3">
          <Link to="/admin/bulk-upload" className="btn-secondary flex items-center gap-2">
            <Upload size={18} /> Bulk Upload
          </Link>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="input-field pl-10 max-w-md"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-cream-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100">
              <tr>
                <th className="text-left py-3 px-4 text-wine-700">Product</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Category</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Price</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Stock</th>
                <th className="text-left py-3 px-4 text-wine-700">Status</th>
                <th className="text-right py-3 px-4 text-wine-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const minPrice = product.variants?.length ? Math.min(...product.variants.map((v) => v.price)) : 0
                const totalStock = product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0
                return (
                  <tr key={product.id} className="border-t border-cream-200 hover:bg-cream-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] ?? 'https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg'}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <span className="font-medium text-wine-800">{product.name}</span>
                          {!product.is_active && (
                            <span className="ml-2 badge bg-amber-100 text-amber-700 text-xs">Draft</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-wine-500 hidden md:table-cell">{product.category?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-wine-600 hidden md:table-cell">
                      {product.variants?.length ? formatBDT(minPrice) : '—'}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className={totalStock <= 5 ? 'text-red-500 font-medium' : 'text-wine-600'}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="p-2 rounded-lg hover:bg-cream-200 text-wine-600" aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-100 text-red-500" aria-label="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-wine-400 py-12">No products found.</p>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-cream-50 rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-cream-50 pb-2 -mt-6 pt-6 z-10">
              <h2 className="text-xl font-serif text-wine-800">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-wine-400 hover:text-wine-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="input-field" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Slug *</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Description (English)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-24 resize-none" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Description (Bangla) <span className="text-wine-400 font-normal">— shown when site language is Bangla</span></label>
                <textarea value={form.description_bn} onChange={(e) => setForm({ ...form, description_bn: e.target.value })} className="input-field min-h-24 resize-none" placeholder="বাংলায় বিবরণ লিখুন..." />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Product Images</label>
                <ImageUploader
                  images={form.images}
                  onImagesChange={(imgs) => setForm({ ...form, images: imgs })}
                />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Additional Image URLs <span className="text-wine-400 font-normal">— one per line, optional</span></label>
                <textarea value={form.imageUrls} onChange={(e) => setForm({ ...form, imageUrls: e.target.value })} className="input-field min-h-16 resize-none" placeholder="https://images.pexels.com/..." />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Video URLs (one per line) <span className="text-wine-400 font-normal">— YouTube or Facebook links</span></label>
                <textarea value={form.videos} onChange={(e) => setForm({ ...form, videos: e.target.value })} className="input-field min-h-20 resize-none" placeholder="https://www.youtube.com/watch?v=..." />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-wine-600">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-wine-600">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                  Active
                </label>
              </div>

              {/* Variants Section */}
              <div className="border-t border-cream-200 pt-4">
                <button
                  onClick={() => setVariantsExpanded(!variantsExpanded)}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h3 className="text-sm font-medium text-wine-700">
                    Variants ({activeVariants.length})
                  </h3>
                  <ChevronDown size={18} className={`text-wine-400 transition-transform ${variantsExpanded ? 'rotate-180' : ''}`} />
                </button>

                {variantsExpanded && (
                  <div className="space-y-3">
                    {variants.map((v, i) => v._deleted ? null : (
                      <div key={i} className="bg-cream-100 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-wine-500">Variant {i + 1}</span>
                          <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-wine-500 block">Size</label>
                            <input type="text" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-cream-300 text-sm" placeholder="0-3M" />
                          </div>
                          <div>
                            <label className="text-xs text-wine-500 block">Color</label>
                            <input type="text" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-cream-300 text-sm" placeholder="Pink" />
                          </div>
                          <div>
                            <label className="text-xs text-wine-500 block">Age</label>
                            <input type="text" value={v.age} onChange={(e) => updateVariant(i, 'age', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-cream-300 text-sm" placeholder="0-3 months" />
                          </div>
                          <div>
                            <label className="text-xs text-wine-500 block">SKU</label>
                            <input type="text" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-cream-300 text-sm" placeholder="BB-001" />
                          </div>
                          <div>
                            <label className="text-xs text-wine-500 block">Price *</label>
                            <input type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-cream-300 text-sm" placeholder="450" />
                          </div>
                          <div>
                            <label className="text-xs text-wine-500 block">Compare At</label>
                            <input type="number" value={v.compare_at_price} onChange={(e) => updateVariant(i, 'compare_at_price', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-cream-300 text-sm" placeholder="600" />
                          </div>
                          <div>
                            <label className="text-xs text-wine-500 block">Stock</label>
                            <input type="number" value={v.stock_quantity} onChange={(e) => updateVariant(i, 'stock_quantity', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-cream-300 text-sm" placeholder="25" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-wine-500">
                          <input type="checkbox" checked={v.is_active} onChange={(e) => updateVariant(i, 'is_active', e.target.checked)} className="w-3.5 h-3.5" />
                          Active
                        </label>
                      </div>
                    ))}
                    <button onClick={addVariant} className="w-full py-2.5 border-2 border-dashed border-cream-400 rounded-xl text-sm text-wine-500 hover:border-blush-300 hover:text-blush-500 transition-colors flex items-center justify-center gap-2">
                      <Plus size={16} /> Add Variant
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 sticky bottom-0 bg-cream-50 pb-2 -mb-6 pt-3">
              <button onClick={handleSave} className="btn-primary flex-1">{editing ? 'Save Changes' : 'Create Product'}</button>
              <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
