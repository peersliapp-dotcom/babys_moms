import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Instagram, Facebook, Mail, Phone, MapPin, Youtube, Twitter } from 'lucide-react'
import { supabase, type SiteSettings } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data }) => {
      setSettings(data as SiteSettings | null)
    })
  }, [])

  const logoUrl = settings?.logo_url ?? '/bmlogonew2.png'
  const phone = settings?.phone ?? '+880 1700 000000'
  const email = settings?.email ?? 'hello@babysandmoms.com'
  const address = settings?.address ?? 'Dhaka, Bangladesh'

  return (
    <footer className="bg-wine-800 text-cream-100 mt-20">
      <div className="section-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <img src={logoUrl} alt="Baby's and Mom's Clothing" className="h-14 w-auto mb-4 brightness-200" />
            <p className="text-sm text-cream-200/80 leading-relaxed">
              Made with love, for you & your little one. Premium baby and maternity clothing from Bangladesh.
            </p>
            <div className="flex gap-3 mt-5">
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-wine-700 hover:bg-blush-500 flex items-center justify-center transition-colors" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
              )}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-wine-700 hover:bg-blush-500 flex items-center justify-center transition-colors" aria-label="Facebook">
                  <Facebook size={16} />
                </a>
              )}
              {settings?.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-wine-700 hover:bg-blush-500 flex items-center justify-center transition-colors" aria-label="YouTube">
                  <Youtube size={16} />
                </a>
              )}
              {settings?.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-wine-700 hover:bg-blush-500 flex items-center justify-center transition-colors" aria-label="Twitter">
                  <Twitter size={16} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-cream-50 font-serif text-lg mb-4">{t('footer.shop')}</h4>
            <ul className="space-y-2 text-sm text-cream-200/80">
              <li><Link to="/shop/baby" className="hover:text-blush-300 transition-colors">{t('nav.baby')}</Link></li>
              <li><Link to="/shop/mom" className="hover:text-blush-300 transition-colors">{t('nav.mom')}</Link></li>
              <li><Link to="/shop" className="hover:text-blush-300 transition-colors">{t('nav.shopAll')}</Link></li>
              <li><Link to="/size-guide" className="hover:text-blush-300 transition-colors">{t('footer.sizeGuide')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-cream-50 font-serif text-lg mb-4">{t('footer.help')}</h4>
            <ul className="space-y-2 text-sm text-cream-200/80">
              <li><Link to="/shipping" className="hover:text-blush-300 transition-colors">{t('footer.shipping')}</Link></li>
              <li><Link to="/returns" className="hover:text-blush-300 transition-colors">{t('footer.returns')}</Link></li>
              <li><Link to="/about" className="hover:text-blush-300 transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/contact" className="hover:text-blush-300 transition-colors">{t('footer.contactUs')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-cream-50 font-serif text-lg mb-4">{t('footer.getInTouch')}</h4>
            <ul className="space-y-3 text-sm text-cream-200/80">
              <li className="flex items-center gap-2"><Phone size={15} /> {phone}</li>
              <li className="flex items-center gap-2"><Mail size={15} /> {email}</li>
              <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0" /> {address}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-wine-700 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-cream-200/60">
          <p>&copy; {new Date().getFullYear()} Baby's and Mom's Clothing. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart size={14} className="fill-blush-400 text-blush-400" /> in Bangladesh
          </p>
        </div>
      </div>
    </footer>
  )
}
