import { useEffect, useState } from 'react'
import { Save, Upload, Phone, Mail, MapPin, Instagram, Facebook, Youtube, Twitter, Truck } from 'lucide-react'
import { supabase, type SiteSettings } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

export default function AdminSettings() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingHeroMobile, setUploadingHeroMobile] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('site_settings').select('*').maybeSingle()
    setSettings(data as SiteSettings | null)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase.from('site_settings').update({
      logo_url: settings.logo_url,
      site_name: settings.site_name,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      instagram_url: settings.instagram_url,
      facebook_url: settings.facebook_url,
      youtube_url: settings.youtube_url,
      twitter_url: settings.twitter_url,
      hero_image_url: settings.hero_image_url,
      hero_mobile_image_url: settings.hero_mobile_image_url,
      pathao_api_key: settings.pathao_api_key,
      steadfast_api_key: settings.steadfast_api_key,
      courier_provider: settings.courier_provider,
    }).eq('id', settings.id)
    if (error) showToast('Failed to save settings', 'error')
    else showToast('Settings saved!', 'success')
    setSaving(false)
  }

  const handleImageUpload = async (file: File, field: 'logo_url' | 'hero_image_url' | 'hero_mobile_image_url', setUploading: (v: boolean) => void) => {
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'png'
    const fileName = `${field.replace('_url', '')}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error) {
      showToast('Failed to upload image', 'error')
    } else {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      setSettings({ ...settings!, [field]: urlData.publicUrl })
      showToast('Image uploaded!', 'success')
    }
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="section-padding py-20 text-center">
        <div className="w-8 h-8 border-2 border-blush-300 border-t-wine-700 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!settings) {
    return <div className="section-padding py-20 text-center"><p className="text-wine-400">Settings not found.</p></div>
  }

  return (
    <div className="section-padding py-8 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Site Settings</h1>

      {/* Logo */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-wine-800 mb-4">Logo</h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl bg-cream-100 flex items-center justify-center overflow-hidden shrink-0">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-wine-300 text-sm">No logo</span>
            )}
          </div>
          <div>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              <Upload size={16} /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo_url', setUploadingLogo)} />
            </label>
            <p className="text-xs text-wine-400 mt-2">PNG or JPG, recommended 200x200px</p>
          </div>
        </div>
      </div>

      {/* Hero Images */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-wine-800 mb-4">Homepage Hero Images</h2>
        <div className="space-y-6">
          <div>
            <label className="text-sm text-wine-600 mb-1.5 block">Desktop Hero Image (recommended 1920x800px)</label>
            <div className="flex items-center gap-4">
              <div className="w-40 h-24 rounded-xl bg-cream-100 overflow-hidden shrink-0">
                {settings.hero_image_url ? (
                  <img src={settings.hero_image_url} alt="Desktop Hero" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><span className="text-wine-300 text-xs">No image</span></div>
                )}
              </div>
              <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                <Upload size={16} /> {uploadingHero ? 'Uploading...' : 'Upload Desktop'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'hero_image_url', setUploadingHero)} />
              </label>
            </div>
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 block">Mobile Hero Image (recommended 800x1000px)</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-32 rounded-xl bg-cream-100 overflow-hidden shrink-0">
                {settings.hero_mobile_image_url ? (
                  <img src={settings.hero_mobile_image_url} alt="Mobile Hero" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><span className="text-wine-300 text-xs">No image</span></div>
                )}
              </div>
              <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                <Upload size={16} /> {uploadingHeroMobile ? 'Uploading...' : 'Upload Mobile'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'hero_mobile_image_url', setUploadingHeroMobile)} />
              </label>
            </div>
            <p className="text-xs text-wine-400 mt-2">If no mobile image is set, the desktop image will be used on mobile.</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-wine-800 mb-4">Contact Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-wine-600 mb-1.5 flex items-center gap-1.5"><Phone size={14} /> Phone</label>
            <input type="text" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 flex items-center gap-1.5"><Mail size={14} /> Email</label>
            <input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 flex items-center gap-1.5"><MapPin size={14} /> Address</label>
            <input type="text" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="input-field" />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-wine-800 mb-4">Social Media</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-wine-600 mb-1.5 flex items-center gap-1.5"><Instagram size={14} /> Instagram URL</label>
            <input type="text" value={settings.instagram_url ?? ''} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} className="input-field" placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 flex items-center gap-1.5"><Facebook size={14} /> Facebook URL</label>
            <input type="text" value={settings.facebook_url ?? ''} onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })} className="input-field" placeholder="https://facebook.com/..." />
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 flex items-center gap-1.5"><Youtube size={14} /> YouTube URL</label>
            <input type="text" value={settings.youtube_url ?? ''} onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })} className="input-field" placeholder="https://youtube.com/..." />
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 flex items-center gap-1.5"><Twitter size={14} /> Twitter URL</label>
            <input type="text" value={settings.twitter_url ?? ''} onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })} className="input-field" placeholder="https://twitter.com/..." />
          </div>
        </div>
      </div>

      {/* Courier Integration */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-wine-800 mb-4 flex items-center gap-2"><Truck size={18} /> Courier Integration</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-wine-600 mb-1.5 block">Default Courier Provider</label>
            <select
              value={settings.courier_provider ?? 'manual'}
              onChange={(e) => setSettings({ ...settings, courier_provider: e.target.value })}
              className="input-field"
            >
              <option value="manual">Manual (enter tracking IDs manually)</option>
              <option value="pathao">Pathao (auto create shipments)</option>
              <option value="steadfast">Steadfast (auto create shipments)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 block">Pathao API Key</label>
            <input
              type="password"
              value={settings.pathao_api_key ?? ''}
              onChange={(e) => setSettings({ ...settings, pathao_api_key: e.target.value })}
              className="input-field"
              placeholder="Enter Pathao API token..."
            />
            <p className="text-xs text-wine-400 mt-1">Get your API key from Pathao merchant portal.</p>
          </div>
          <div>
            <label className="text-sm text-wine-600 mb-1.5 block">Steadfast API Key</label>
            <input
              type="password"
              value={settings.steadfast_api_key ?? ''}
              onChange={(e) => setSettings({ ...settings, steadfast_api_key: e.target.value })}
              className="input-field"
              placeholder="Enter Steadfast API key..."
            />
            <p className="text-xs text-wine-400 mt-1">Get your API key from Steadfast courier portal.</p>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        {saving ? <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
        Save Settings
      </button>
    </div>
  )
}
