import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Heart, User, Menu, X, Search, Globe } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase, type SiteSettings, type Product } from '../lib/supabase'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const { itemCount } = useCart()
  const { session, profile } = useAuth()
  const { lang, toggleLang, t } = useLanguage()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data }) => {
      setSettings(data as SiteSettings | null)
    })
  }, [])

  const logoUrl = settings?.logo_url ?? '/bmlogonew2.png'

  useEffect(() => {
    setLogoError(false)
    setLogoLoaded(false)
  }, [logoUrl])

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*)')
        .eq('is_active', true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(6)
      setSearchResults((data as Product[]) ?? [])
      setSearchLoading(false)
    }, 250)
  }, [searchQuery])

  // Close search on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const navLinks = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.baby'), path: '/shop/baby' },
    { label: t('nav.mom'), path: '/shop/mom' },
    { label: t('nav.shopAll'), path: '/shop' },
    { label: t('nav.about'), path: '/about' },
    { label: t('nav.contact'), path: '/contact' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-cream-50/95 backdrop-blur-md shadow-md' : 'bg-cream-50/80 backdrop-blur-sm'
        }`}
      >
        <nav className="section-padding h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-wine-700"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              {logoError ? (
                <span className="brand-title text-base lg:text-lg xl:text-xl">
                  Baby&rsquo;s &amp; Mom&rsquo;s
                </span>
              ) : (
                <>
                  <div className="relative h-10 w-auto min-w-[40px]">
                    {!logoLoaded && (
                      <div className="logo-skeleton absolute inset-0 min-w-[40px] rounded-full" />
                    )}
                    <img
                      src={logoUrl}
                      alt=""
                      className={`h-10 w-auto transition-opacity duration-500 ${
                        logoLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setLogoLoaded(true)}
                      onError={() => setLogoError(true)}
                    />
                  </div>
                  <span className="brand-title hidden sm:inline text-base lg:text-lg xl:text-xl">
                    Baby&rsquo;s &amp; Mom&rsquo;s
                  </span>
                </>
              )}
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-medium text-wine-700 hover:text-blush-500 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blush-400 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-wine-700 hover:text-blush-500 transition-colors" aria-label="Search">
              <Search size={20} />
            </button>
            <button onClick={toggleLang} className="flex items-center gap-1 text-wine-700 hover:text-blush-500 transition-colors" aria-label="Switch language">
              <Globe size={18} />
              <span className="text-xs font-medium">{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-wine-700 hover:text-blush-500 transition-colors hidden sm:block">
                <span className="text-xs font-medium">{t('nav.admin')}</span>
              </Link>
            )}
            <Link to={session ? '/account' : '/login'} className="text-wine-700 hover:text-blush-500 transition-colors">
              <User size={20} />
            </Link>
            <Link to="/wishlist" className="text-wine-700 hover:text-blush-500 transition-colors hidden sm:block">
              <Heart size={20} />
            </Link>
            <Link to="/cart" className="relative text-wine-700 hover:text-blush-500 transition-colors">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blush-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {searchOpen && (
          <div ref={searchRef} className="absolute top-full left-0 right-0 bg-cream-50 border-t border-cream-300 shadow-lg animate-slide-down">
            <div className="section-padding py-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search.placeholder')}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-cream-400 bg-white focus:outline-none focus:ring-2 focus:ring-blush-300"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-wine-400" size={20} />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-wine-400 hover:text-wine-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </form>

              {/* Live search results */}
              {searchQuery.trim() && (
                <div className="mt-3">
                  {searchLoading ? (
                    <div className="flex items-center gap-2 text-sm text-wine-400 py-4">
                      <div className="w-4 h-4 border-2 border-wine-300 border-t-transparent rounded-full animate-spin" />
                      {t('search.searching')}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs text-wine-400 uppercase tracking-wide mb-2">{t('search.suggestions')}</p>
                      {searchResults.map((product) => {
                        const minPrice = product.variants?.length ? Math.min(...product.variants.map(v => v.price)) : 0
                        return (
                          <Link
                            key={product.id}
                            to={`/product/${product.slug}`}
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream-100 transition-colors group"
                          >
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-wine-800 truncate group-hover:text-blush-500 transition-colors">{product.name}</p>
                              <p className="text-xs text-wine-400">{product.category?.name}</p>
                            </div>
                            <span className="text-sm font-semibold text-wine-700 shrink-0">৳{minPrice.toLocaleString()}</span>
                          </Link>
                        )
                      })}
                      <button
                        onClick={() => {
                          navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
                          setSearchOpen(false)
                          setSearchQuery('')
                          setSearchResults([])
                        }}
                        className="text-sm text-blush-500 hover:text-blush-600 font-medium pt-2 pb-1 block w-full text-left"
                      >
                        {t('search.viewAll')} "{searchQuery}" →
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-wine-400">{t('search.noResults')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-cream-50 shadow-xl animate-slide-down p-6 pt-20" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)} className="text-lg font-medium text-wine-700 hover:text-blush-500 transition-colors py-2 border-b border-cream-200">
                  {link.label}
                </Link>
              ))}
              {session && (
                <Link to="/account" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-wine-700 hover:text-blush-500 transition-colors py-2 border-b border-cream-200">
                  {t('nav.account')}
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-wine-700 hover:text-blush-500 transition-colors py-2">
                  {t('nav.adminDashboard')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="h-16" />
    </>
  )
}
