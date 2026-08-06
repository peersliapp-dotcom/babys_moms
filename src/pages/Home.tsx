import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Truck, RefreshCw, Shield, ChevronRight, Sparkles } from 'lucide-react'
import { supabase, type Product, type Category, type Banner, type SiteSettings } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { useToast } from '../contexts/ToastContext'

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: "Baby's and Mom's Clothing",
  url: 'https://babysandmoms.net',
  logo: 'https://babysandmoms.net/bmlogonew2.png',
  description:
    "Premium baby and maternity clothing from Bangladesh, crafted with the softest fabrics and utmost care.",
  areaServed: 'BD',
}

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    async function load() {
      const [featuredRes, newArrivalsRes, categoriesRes, bannersRes, settingsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*), variants:product_variants(*)')
          .eq('is_active', true)
          .eq('is_featured', true)
          .limit(8),
        supabase
          .from('products')
          .select('*, category:categories(*), variants:product_variants(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('categories')
          .select('*')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
          .limit(3),
        supabase
          .from('site_settings')
          .select('*')
          .maybeSingle(),
      ])

      setFeatured((featuredRes.data as Product[]) ?? [])
      setNewArrivals((newArrivalsRes.data as Product[]) ?? [])
      setCategories((categoriesRes.data as Category[]) ?? [])
      setBanners((bannersRes.data as Banner[]) ?? [])
      setSettings(settingsRes.data as SiteSettings | null)
      setLoading(false)
    }
    load()
  }, [])

  const defaultHero = 'https://i.ibb.co.com/v4388nf3/657371760-122097034964914680-2462231761944454697-n.jpg'
  const heroDesktop = settings?.hero_image_url ?? defaultHero
  const heroMobile = settings?.hero_mobile_image_url ?? settings?.hero_image_url ?? defaultHero

  return (
    <div className="animate-fade-in">
      <Seo
        title=""
        description="Shop premium baby and maternity clothing from Bangladesh. Soft, safe fabrics for your little one and comfortable maternity wear — made with love."
        path="/"
        jsonLd={homeJsonLd}
      />
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[420px] md:h-[70vh] md:min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroDesktop}
            alt="Baby's and Mom's Clothing"
            className="w-full h-full object-cover hidden md:block"
          />
          <img
            src={heroMobile}
            alt="Baby's and Mom's Clothing"
            className="w-full h-full object-cover md:hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-wine-900/70 via-wine-800/40 to-transparent" />
        </div>
        <div className="relative h-full flex items-center section-padding">
          <div className="max-w-xl">
            <p className="text-blush-200 font-script text-xl md:text-2xl mb-2">Made with love</p>
            <h1 className="text-3xl md:text-6xl font-serif text-cream-50 leading-tight mb-4">
              For you & your<br />little one
            </h1>
            <p className="text-cream-100/90 text-base md:text-lg mb-6 md:mb-8 max-w-md">
              Premium baby and maternity clothing, crafted with the softest fabrics and the utmost care.
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Link to="/shop" className="bg-blush-400 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-full font-medium hover:bg-blush-500 transition-all hover:shadow-lg active:scale-95 text-sm md:text-base">
                Shop Collection
              </Link>
              <Link to="/about" className="border-2 border-cream-50 text-cream-50 px-6 md:px-8 py-3 md:py-3.5 rounded-full font-medium hover:bg-cream-50 hover:text-wine-800 transition-all active:scale-95 text-sm md:text-base">
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="section-padding py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Safe Fabrics', desc: 'Tested for baby skin' },
            { icon: Truck, title: 'Fast Delivery', desc: 'All over Bangladesh' },
            { icon: RefreshCw, title: 'Easy Returns', desc: '7-day exchange' },
            { icon: Crown, title: 'Premium Quality', desc: 'Curated with care' },
          ].map((badge) => (
            <div key={badge.title} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blush-100 flex items-center justify-center shrink-0">
                <badge.icon className="text-wine-700" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-wine-800 text-sm">{badge.title}</h4>
                <p className="text-xs text-wine-400">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="section-padding py-12">
        <div className="text-center mb-10">
          <p className="text-blush-500 font-script text-xl mb-1">Explore</p>
          <h2 className="text-3xl md:text-4xl font-serif text-wine-800">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop/${cat.slug}`}
                className="relative h-72 rounded-2xl overflow-hidden group"
              >
                <img
                  src={cat.image_url ?? `https://images.pexels.com/photos/${cat.slug === 'baby' ? '1648387' : '3933250'}/pexels-photo-${cat.slug === 'baby' ? '1648387' : '3933250'}.jpeg`}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-wine-900/70 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-2xl font-serif text-cream-50 mb-1">{cat.name}</h3>
                  <p className="text-cream-100/80 text-sm flex items-center gap-1">
                    Shop now <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <>
              <Link to="/shop/baby" className="relative h-72 rounded-2xl overflow-hidden group">
                <img src="https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg" alt="Baby" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-wine-900/70 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-2xl font-serif text-cream-50 mb-1">Baby</h3>
                  <p className="text-cream-100/80 text-sm flex items-center gap-1">Shop now <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></p>
                </div>
              </Link>
              <Link to="/shop/mom" className="relative h-72 rounded-2xl overflow-hidden group">
                <img src="https://images.pexels.com/photos/3933250/pexels-photo-3933250.jpeg" alt="Mom" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-wine-900/70 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-2xl font-serif text-cream-50 mb-1">Mom</h3>
                  <p className="text-cream-100/80 text-sm flex items-center gap-1">Shop now <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></p>
                </div>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section-padding py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-blush-500 font-script text-xl mb-1 flex items-center gap-1.5">
              <Sparkles size={16} className="text-gold-400" /> Fresh picks
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-wine-800">New Arrivals</h2>
          </div>
          <Link to="/shop" className="text-wine-600 hover:text-blush-500 text-sm font-medium flex items-center gap-1 transition-colors">
            View all <ChevronRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-cream-100 animate-pulse" />
            ))}
          </div>
        ) : newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-cream-100 flex items-center justify-center text-wine-300">
                <span className="text-sm">Coming soon</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="section-padding py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-blush-500 font-script text-xl mb-1">Loved by moms</p>
            <h2 className="text-3xl md:text-4xl font-serif text-wine-800">Best Sellers</h2>
          </div>
          <Link to="/shop" className="text-wine-600 hover:text-blush-500 text-sm font-medium flex items-center gap-1 transition-colors">
            View all <ChevronRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-cream-100 animate-pulse" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-cream-100 flex items-center justify-center text-wine-300">
                <span className="text-sm">Coming soon</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="section-padding py-16">
        <div className="bg-gradient-to-r from-blush-100 to-cream-200 rounded-3xl p-10 md:p-16 text-center">
          <Crown className="text-gold-500 mx-auto mb-4" size={32} />
          <h2 className="text-2xl md:text-3xl font-serif text-wine-800 mb-3">Join Our Family</h2>
          <p className="text-wine-600 mb-6 max-w-md mx-auto">
            Subscribe and get 10% off your first order, plus early access to new collections and special offers.
          </p>
          {subscribed ? (
            <div className="max-w-md mx-auto card p-6 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Crown size={18} className="text-green-600" />
              </div>
              <p className="text-wine-700 text-sm font-medium">You're subscribed! Check your inbox for the 10% off code.</p>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formEl = e.target as HTMLFormElement
              const emailInput = formEl.querySelector('input[type="email"]') as HTMLInputElement
              const email = emailInput.value.trim()
              if (!email) return
              setSubscribing(true)
              const { error } = await supabase
                .from('subscribers')
                .insert({ email })
              if (error) {
                if (error.code === '23505') {
                  showToast("You're already subscribed!", 'info')
                } else {
                  showToast('Something went wrong. Please try again.', 'error')
                }
              } else {
                setSubscribed(true)
                showToast('Subscribed successfully!', 'success')
              }
              setSubscribing(false)
            }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field flex-1"
                required
                disabled={subscribing}
              />
              <button type="submit" disabled={subscribing} className="btn-primary whitespace-nowrap flex items-center justify-center gap-2">
                {subscribing ? <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" /> : 'Subscribe'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding py-12">
        <div className="text-center mb-10">
          <p className="text-blush-500 font-script text-xl mb-1">Happy moms</p>
          <h2 className="text-3xl md:text-4xl font-serif text-wine-800">What They Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Aisha R.', text: 'The fabric is incredibly soft and gentle on my baby\'s skin. Worth every taka!', location: 'Dhaka' },
            { name: 'Nusrat J.', text: 'Beautiful maternity wear that actually fits comfortably. Highly recommend!', location: 'Chittagong' },
            { name: 'Fatima K.', text: 'Fast delivery and the quality is amazing. My go-to for baby clothes now.', location: 'Sylhet' },
          ].map((review) => (
            <div key={review.name} className="card p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-gold-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-wine-600 text-sm leading-relaxed mb-4">"{review.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blush-200 flex items-center justify-center text-wine-700 font-medium">
                  {review.name[0]}
                </div>
                <div>
                  <p className="font-medium text-wine-800 text-sm">{review.name}</p>
                  <p className="text-xs text-wine-400">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
