import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { supabase, type Product, type Category } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

export default function Shop() {
  const { categorySlug } = useParams()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') ?? ''
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categorySlug ?? null)
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])

  useEffect(() => {
    setSelectedCategory(categorySlug ?? null)
  }, [categorySlug])

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*)')
        .eq('is_active', true)

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data } = await query
      setProducts((data as Product[]) ?? [])

      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      setCategories((catData as Category[]) ?? [])

      setLoading(false)
    }
    load()
  }, [searchQuery])

  const allSizes = useMemo(() => {
    const sizes = new Set<string>()
    products.forEach((p) => p.variants?.forEach((v) => v.size && sizes.add(v.size)))
    return Array.from(sizes).sort()
  }, [products])

  const allColors = useMemo(() => {
    const colors = new Set<string>()
    products.forEach((p) => p.variants?.forEach((v) => v.color && colors.add(v.color)))
    return Array.from(colors).sort()
  }, [products])

  const filtered = useMemo(() => {
    let result = [...products]

    if (selectedCategory) {
      result = result.filter((p) => {
        if (p.category?.slug === selectedCategory) return true
        const childCats = categories.filter((c) => {
          const parent = categories.find((pc) => pc.id === c.parent_id)
          return parent?.slug === selectedCategory
        })
        return childCats.some((cc) => cc.id === p.category_id)
      })
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.variants?.some((v) => v.size && selectedSizes.includes(v.size)))
    }

    if (selectedColors.length > 0) {
      result = result.filter((p) => p.variants?.some((v) => v.color && selectedColors.includes(v.color)))
    }

    result = result.filter((p) => {
      const minPrice = p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : 0
      return minPrice >= priceRange[0] && minPrice <= priceRange[1]
    })

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => {
          const aMin = a.variants?.length ? Math.min(...a.variants.map((v) => v.price)) : 0
          const bMin = b.variants?.length ? Math.min(...b.variants.map((v) => v.price)) : 0
          return aMin - bMin
        })
        break
      case 'price-high':
        result.sort((a, b) => {
          const aMin = a.variants?.length ? Math.min(...a.variants.map((v) => v.price)) : 0
          const bMin = b.variants?.length ? Math.min(...b.variants.map((v) => v.price)) : 0
          return bMin - aMin
        })
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [products, selectedCategory, selectedSizes, selectedColors, priceRange, sortBy, categories])

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size])
  }
  const toggleColor = (color: string) => {
    setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color])
  }

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-wine-800 mb-3">Category</h4>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-sm block w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
              !selectedCategory ? 'bg-blush-100 text-wine-700 font-medium' : 'text-wine-500 hover:bg-cream-100'
            }`}
          >
            All Products
          </button>
          {categories.filter((c) => !c.parent_id).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`text-sm block w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                selectedCategory === cat.slug ? 'bg-blush-100 text-wine-700 font-medium' : 'text-wine-500 hover:bg-cream-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {allSizes.length > 0 && (
        <div>
          <h4 className="font-medium text-wine-800 mb-3">Size</h4>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  selectedSizes.includes(size)
                    ? 'border-wine-700 bg-wine-700 text-cream-50'
                    : 'border-cream-400 text-wine-600 hover:border-blush-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {allColors.length > 0 && (
        <div>
          <h4 className="font-medium text-wine-800 mb-3">Color</h4>
          <div className="flex flex-wrap gap-2">
            {allColors.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  selectedColors.includes(color)
                    ? 'border-wine-700 bg-wine-700 text-cream-50'
                    : 'border-cream-400 text-wine-600 hover:border-blush-300'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium text-wine-800 mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="w-24 px-2 py-1.5 rounded-lg border border-cream-400 text-sm"
            placeholder="Min"
          />
          <span className="text-wine-400">—</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-24 px-2 py-1.5 rounded-lg border border-cream-400 text-sm"
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="section-padding py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-serif text-wine-800 mb-2">
          {selectedCategory
            ? categories.find((c) => c.slug === selectedCategory)?.name ?? 'Shop'
            : searchQuery
            ? `Results for "${searchQuery}"`
            : 'Shop All'}
        </h1>
        <p className="text-wine-400 text-sm">{filtered.length} products</p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium text-wine-700"
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 rounded-xl border border-cream-400 bg-white text-sm text-wine-700 focus:outline-none focus:ring-2 focus:ring-blush-300"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-cream-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-wine-400 text-lg">No products found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowFilters(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-0 right-0 bottom-0 w-80 bg-cream-50 p-6 overflow-y-auto animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-wine-800">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-wine-500">
                <X size={24} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  )
}
