import { useEffect, useState } from 'react'
import { Crown, Heart, Shield, Leaf, Phone, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, type SiteSettings } from '../lib/supabase'

export default function About() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data }) => {
      setSettings(data as SiteSettings | null)
    })
  }, [])

  const phone = settings?.phone ?? '+880 1700 000000'
  const email = settings?.email ?? 'hello@babysandmoms.com'
  const address = settings?.address ?? 'Dhaka, Bangladesh'

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <img
          src="https://i.ibb.co.com/0VmkNg30/foraboutus.png"
          alt="Our Story"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-wine-900/70 to-wine-800/30" />
        <div className="relative h-full flex items-center section-padding">
          <div>
            <p className="text-blush-200 font-script text-2xl mb-2">Our Story</p>
            <h1 className="text-4xl font-serif text-cream-50">Made with love</h1>
          </div>
        </div>
      </section>

      <section className="section-padding py-16 max-w-3xl mx-auto">
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-wine-600 leading-relaxed mb-6 font-serif italic">
            "Every piece we create is a hug for your little one, and a celebration of you."
          </p>
          <p className="text-wine-600 leading-relaxed mb-6">
            Baby's and Mom's Clothing was born from a simple idea: that the clothes touching a baby's
            delicate skin should be as soft, safe, and beautiful as the love they're wrapped in. Founded
            in Bangladesh by a mother who couldn't find the quality she wanted for her own children, our
            brand has grown into a trusted name for parents across the country.
          </p>
          <p className="text-wine-600 leading-relaxed mb-6">
            We believe that motherhood is a journey to be celebrated — not just endured. That's why we
            create clothing that's not only practical and comfortable but also elegant and confidence-inspiring.
            From the softest baby bodysuits to beautiful maternity wear, every piece is thoughtfully designed
            and carefully crafted.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Leaf, title: 'Safe & Soft', desc: 'We use only premium, skin-friendly fabrics tested for the most delicate skin.' },
            { icon: Heart, title: 'Made with Love', desc: 'Every stitch is a labor of love, crafted by skilled artisans who care.' },
            { icon: Crown, title: 'Premium Quality', desc: 'We never compromise on quality. Every piece meets our high standards.' },
          ].map((value) => (
            <div key={value.title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-blush-100 flex items-center justify-center mx-auto mb-4">
                <value.icon className="text-wine-700" size={24} />
              </div>
              <h3 className="font-serif text-lg text-wine-800 mb-2">{value.title}</h3>
              <p className="text-sm text-wine-500 leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 bg-blush-50 rounded-2xl p-10">
          <Shield className="text-gold-500 mx-auto mb-4" size={32} />
          <h2 className="text-2xl font-serif text-wine-800 mb-3">Our Promise</h2>
          <p className="text-wine-600 max-w-xl mx-auto mb-6">
            If you're not completely happy with your purchase, we offer easy 7-day returns and exchanges.
            Your satisfaction is our priority.
          </p>
          <Link to="/shop" className="btn-primary">Shop Our Collection</Link>
        </div>

        {/* Contact Info from Site Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            { icon: Phone, title: 'Call Us', value: phone, sub: 'Sun–Fri, 10AM–8PM' },
            { icon: Mail, title: 'Email Us', value: email, sub: 'We reply within 24 hours' },
            { icon: MapPin, title: 'Visit Us', value: address, sub: 'Bangladesh' },
          ].map((item) => (
            <div key={item.title} className="card p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blush-100 flex items-center justify-center mx-auto mb-3">
                <item.icon size={20} className="text-wine-700" />
              </div>
              <h3 className="font-medium text-wine-800 mb-1">{item.title}</h3>
              <p className="text-sm text-wine-600">{item.value}</p>
              <p className="text-xs text-wine-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
