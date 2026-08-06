import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { supabase, type SiteSettings } from '../lib/supabase'
import Seo from '../components/Seo'

export default function Contact() {
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data }) => {
      setSettings(data as SiteSettings | null)
    })
  }, [])

  const phone = settings?.phone ?? '+880 1700 000000'
  const email = settings?.email ?? 'hello@babysandmoms.com'
  const address = settings?.address ?? 'Dhaka, Bangladesh'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      })
    if (error) {
      showToast('Something went wrong. Please try again.', 'error')
    } else {
      showToast("Message sent! We'll get back to you soon.", 'success')
      setForm({ name: '', email: '', subject: '', message: '' })
    }
    setSending(false)
  }

  return (
    <div className="section-padding py-12 max-w-5xl mx-auto animate-fade-in">
      <Seo
        title="Contact Us"
        description="Get in touch with Baby's and Mom's Clothing. We respond within 24 hours to questions about orders, sizing, shipping and returns across Bangladesh."
        path="/contact"
      />
      <div className="text-center mb-10">
        <h1 className="text-3xl font-serif text-wine-800 mb-3">Get in Touch</h1>
        <p className="text-wine-500">We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
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

      <form onSubmit={handleSubmit} className="card p-8 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-wine-600 mb-1.5 block">Your Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm text-wine-600 mb-1.5 block">Subject</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div className="mb-6">
          <label className="text-sm text-wine-600 mb-1.5 block">Message</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="input-field min-h-32 resize-none"
            required
          />
        </div>
        <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
          {sending ? (
            <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} /> Send Message
            </>
          )}
        </button>
      </form>
    </div>
  )
}
