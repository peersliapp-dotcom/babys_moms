import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Heart, User, Menu, X, Search } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type SiteSettings } from '../lib/supabase'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const { itemCount } = useCart()
  const { session, profile } = useAuth()
  const navigate = useNavigate()

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Baby', path: '/shop/baby' },
    { label: 'Mom', path: '/shop/mom' },
    { label: 'Shop All', path: '/shop' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ]

  const logoUrl = settings?.logo_url ?? '/bmlogonew2.png'

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
            <Link to="/" className="flex items-center gap-2">
              <img src={logoUrl} alt="Baby's and Mom's Clothing" className="h-10 w-auto" />
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
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-wine-700 hover:text-blush-500 transition-colors hidden sm:block">
                <span className="text-xs font-medium">Admin</span>
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
          <div className="absolute top-full left-0 right-0 bg-cream-50 border-t border-cream-300 shadow-lg animate-slide-down">
            <form onSubmit={handleSearch} className="section-padding py-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-cream-400 bg-white focus:outline-none focus:ring-2 focus:ring-blush-300"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-wine-400" size={20} />
              </div>
            </form>
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
                  My Account
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-wine-700 hover:text-blush-500 transition-colors py-2">
                  Admin Dashboard
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
