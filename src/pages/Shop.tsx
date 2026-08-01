import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react'
import { supabase, type Product, type Category } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'

// Multi-select dropdown chip
function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const count = selected.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
          count > 0
            ? 'border-wine-600 bg-wine-50 text-wine-700'
            : 'border-cream-300 bg-white text-wine-600 hover:border-blush-300'
        }`}
      >
        {label}
        {count > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-wine-600 text-white text-[10px] font-bold leading-none">
            {count}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-wine-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && options.length > 0 && (
        <div className="absolute top-full mt-2 left-0 z-30 min-w-[160px] bg-white rounded-2xl shadow-xl border border-cream-200 py-1.5 animate-fade-in">
          {options.map((opt) => {
            const active = selected.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm transition-colors ${
                  active ? 'text-wine-700 font-medium bg-blush-50' : 'text-wine-600 hover:bg-cream-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    active ? 'bg-wine-600 border-wine-600' : 'border-cream-400'
                  }`}
                >
                  {active && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                {opt}
              </button>
            )
          })}
          {selected.length > 0 && (
            <>
              <div className="my-1 border-t border-cream-100" />
              <button
                onClick={() => options.forEach((o) => selected.includes(o) && onToggle(o))}
                className="w-full text-left px-4 py-1.5 text-xs text-wine-400 hover:text-wine-600 transition-colors"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0])
  const [draftMin, setDraftMin] = useState('')
  const [draftMax, setDraftMax] = useState('')
  const priceRangeInitialized = useRef(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedAges, setSelectedAges] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedCategory(categorySlug ?? null)
    if (categorySlug) {
      const parent = categories.find((c) => c.slug === categorySlug)
      if (parent) {
        setExpanded((prev) => new Set(prev).add(parent.id))
      }
    }
  }, [categorySlug, categories])

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

  const allAges = useMemo(() => {
    const ages = new Set<string>()
    products.forEach((p) => p.variants?.forEach((v) => v.age && ages.add(v.age)))
    return Array.from(ages).sort()
  }, [products])

  const maxPrice = useMemo(() => {
    let m = 0
    products.forEach((p) => {
      p.variants?.forEach((v) => { if (v.price > m) m = v.price })
    })
    return m > 0 ? Math.ceil(m / 500) * 500 : 5000
  }, [products])

  useEffect(() => {
    if (!priceRangeInitialized.current && maxPrice > 0) {
      setPriceRange([0, maxPrice])
      setDraftMin('0')
      setDraftMax(String(maxPrice))
      priceRangeInitialized.current = true
    }
  }, [maxPrice])

  function applyPriceRange() {
    const lo = Math.max(0, Number(draftMin) || 0)
    const hi = Math.max(lo, Number(draftMax) || maxPrice)
    setDraftMin(String(lo))
    setDraftMax(String(hi))
    setPriceRange([lo, hi])
  }

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

    if (selectedAges.length > 0) {
      result = result.filter((p) => p.variants?.some((v) => v.age && selectedAges.includes(v.age)))
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
  }, [products, selectedCategory, selectedSizes, selectedColors, selectedAges, priceRange, sortBy, categories])

  const toggleSize = (size: string) => setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size])
  const toggleColor = (color: string) => setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color])
  const toggleAge = (age: string) => setSelectedAges((prev) => prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age])

  const totalActiveFilters = selectedSizes.length + selectedColors.length + selectedAges.length

  // Category + Price sidebar (desktop)
  const SidebarFilters = () => (
    <div className="space-y-7">
      <div>
        <h4 className="font-semibold text-wine-800 text-sm uppercase tracking-wide mb-3">Category</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-sm block w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
              !selectedCategory ? 'bg-blush-100 text-wine-700 font-medium' : 'text-wine-500 hover:bg-cream-100'
            }`}
          >
            All Products
          </button>
          {categories.filter((c) => !c.parent_id).map((parent) => {
            const children = categories.filter((c) => c.parent_id === parent.id)
            const isOpen = expanded.has(parent.id)
            const isParentSelected = selectedCategory === parent.slug
            const hasActiveChild = children.some((c) => c.slug === selectedCategory)

            return (
              <div key={parent.id}>
                <button
                  onClick={() => {
                    setSelectedCategory(parent.slug)
                    setExpanded((prev) => {
                      const next = new Set(prev)
                      if (next.has(parent.id)) next.delete(parent.id)
                      else next.add(parent.id)
                      return next
                    })
                  }}
                  className={`text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    isParentSelected || hasActiveChild ? 'text-wine-700 font-medium' : 'text-wine-600 hover:bg-cream-100'
                  }`}
                >
                  <span className="flex-1">{parent.name}</span>
                  {children.length > 0 && (
                    <ChevronDown
                      size={14}
                      className={`text-wine-300 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
                {children.length > 0 && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-60 opacity-100 py-0.5' : 'max-h-0 opacity-0 py-0'
                    }`}
                  >
                    <div className="ml-4 space-y-0.5 border-l border-cream-200/70">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setSelectedCategory(child.slug)}
                          className={`text-xs w-full text-left pl-3 pr-3 py-1.5 rounded-lg transition-colors ${
                            selectedCategory === child.slug
                              ? 'bg-blush-50 text-wine-700 font-medium'
                              : 'text-wine-400 hover:text-wine-500 hover:bg-cream-50'
                          }`}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-wine-800 text-sm uppercase tracking-wide mb-3">Price Range</h4>
        <div className="flex gap-2 mb-2">
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-wine-400 pointer-events-none">৳</span>
            <input
              type="number"
              value={draftMin}
              min={0}
              step={50}
              onChange={(e) => setDraftMin(e.target.value)}
              onBlur={applyPriceRange}
              onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-cream-300 bg-white text-sm text-wine-700 focus:outline-none focus:ring-2 focus:ring-blush-300"
              placeholder="Min"
            />
          </div>
          <span className="text-wine-300 self-center text-sm">—</span>
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-wine-400 pointer-events-none">৳</span>
            <input
              type="number"
              value={draftMax}
              min={0}
              step={50}
              onChange={(e) => setDraftMax(e.target.value)}
              onBlur={applyPriceRange}
              onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-cream-300 bg-white text-sm text-wine-700 focus:outline-none focus:ring-2 focus:ring-blush-300"
              placeholder="Max"
            />
          </div>
        </div>
        {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
          <button
            onClick={() => {
              setPriceRange([0, maxPrice])
              setDraftMin('0')
              setDraftMax(String(maxPrice))
            }}
            className="text-xs text-wine-400 hover:text-wine-600 transition-colors"
          >
            Reset price
          </button>
        )}
      </div>
    </div>
  )

  // Full filter panel for mobile drawer
  const MobileFilters = () => (
    <div className="space-y-7">
      <SidebarFilters />

      {allSizes.length > 0 && (
        <div>
          <h4 className="font-semibold text-wine-800 text-sm uppercase tracking-wide mb-3">Size</h4>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  selectedSizes.includes(size)
                    ? 'border-wine-700 bg-wine-700 text-cream-50'
                    : 'border-cream-300 text-wine-600 hover:border-blush-300'
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
          <h4 className="font-semibold text-wine-800 text-sm uppercase tracking-wide mb-3">Color</h4>
          <div className="flex flex-wrap gap-2">
            {allColors.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  selectedColors.includes(color)
                    ? 'border-wine-700 bg-wine-700 text-cream-50'
                    : 'border-cream-300 text-wine-600 hover:border-blush-300'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {allAges.length > 0 && (
        <div>
          <h4 className="font-semibold text-wine-800 text-sm uppercase tracking-wide mb-3">Age</h4>
          <div className="flex flex-wrap gap-2">
            {allAges.map((age) => (
              <button
                key={age}
                onClick={() => toggleAge(age)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  selectedAges.includes(age)
                    ? 'border-wine-700 bg-wine-700 text-cream-50'
                    : 'border-cream-300 text-wine-600 hover:border-blush-300'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const activeCategory = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.name
    : undefined
  const shopTitle = activeCategory
    ? `${activeCategory} Clothing`
    : searchQuery
    ? `Search: ${searchQuery}`
    : 'Shop All'

  return (
    <div className="section-padding py-8 animate-fade-in">
      <Seo
        title={shopTitle}
        description={
          activeCategory
            ? `Shop ${activeCategory.toLowerCase()} clothing at Baby's and Mom's Clothing. Premium, soft and safe fabrics delivered across Bangladesh.`
            : "Browse the full collection of premium baby and maternity clothing at Baby's and Mom's Clothing. Soft, safe fabrics delivered across Bangladesh."
        }
        path={selectedCategory ? `/shop/${selectedCategory}` : '/shop'}
        noindex={!!searchQuery}
      />
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
        {/* Desktop sidebar — Category + Price only */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <SidebarFilters />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Top filter bar */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {/* Mobile: open drawer */}
            <button
              onClick={() => setShowFilters(true)}
              className={`lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                totalActiveFilters > 0
                  ? 'border-wine-600 bg-wine-50 text-wine-700'
                  : 'border-cream-300 bg-white text-wine-600'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {totalActiveFilters > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-wine-600 text-white text-[10px] font-bold">
                  {totalActiveFilters}
                </span>
              )}
            </button>

            {/* Desktop inline dropdowns */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              {allSizes.length > 0 && (
                <FilterDropdown
                  label="Size"
                  options={allSizes}
                  selected={selectedSizes}
                  onToggle={toggleSize}
                />
              )}
              {allColors.length > 0 && (
                <FilterDropdown
                  label="Color"
                  options={allColors}
                  selected={selectedColors}
                  onToggle={toggleColor}
                />
              )}
              {allAges.length > 0 && (
                <FilterDropdown
                  label="Age"
                  options={allAges}
                  selected={selectedAges}
                  onToggle={toggleAge}
                />
              )}
              {totalActiveFilters > 0 && (
                <button
                  onClick={() => {
                    setSelectedSizes([])
                    setSelectedColors([])
                    setSelectedAges([])
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-wine-400 hover:text-wine-600 transition-colors"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            {/* Sort — pushed to the right */}
            <div className="ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3.5 py-2 rounded-xl border border-cream-300 bg-white text-sm text-wine-700 focus:outline-none focus:ring-2 focus:ring-blush-300"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {totalActiveFilters > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {selectedSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine-50 border border-wine-200 text-xs text-wine-700 hover:bg-wine-100 transition-colors"
                >
                  {s} <X size={11} />
                </button>
              ))}
              {selectedColors.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleColor(c)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine-50 border border-wine-200 text-xs text-wine-700 hover:bg-wine-100 transition-colors"
                >
                  {c} <X size={11} />
                </button>
              ))}
              {selectedAges.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAge(a)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine-50 border border-wine-200 text-xs text-wine-700 hover:bg-wine-100 transition-colors"
                >
                  {a} <X size={11} />
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-cream-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
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

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowFilters(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-0 right-0 bottom-0 w-80 bg-cream-50 p-6 overflow-y-auto animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-wine-800">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-wine-500 hover:text-wine-700">
                <X size={24} />
              </button>
            </div>
            <MobileFilters />
          </div>
        </div>
      )}
    </div>
  )
}
