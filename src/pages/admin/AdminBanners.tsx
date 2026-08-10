import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from 'lucide-react'
import { supabase, type Banner } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import AdminBackLink from '../../components/AdminBackLink'

export default function AdminBanners() {
  const { showToast } = useToast()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState({
    title: '', subtitle: '', image_url: '', link_url: '', button_text: '', sort_order: '0', is_active: true,
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners((data as Banner[]) ?? [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '', sort_order: '0', is_active: true })
    setShowForm(true)
  }

  const openEdit = (b: Banner) => {
    setEditing(b)
    setForm({
      title: b.title, subtitle: b.subtitle ?? '', image_url: b.image_url, link_url: b.link_url ?? '',
      button_text: b.button_text ?? '', sort_order: String(b.sort_order), is_active: b.is_active,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.image_url.trim()) { showToast('Title and image URL are required', 'error'); return }
    const data = {
      title: form.title, subtitle: form.subtitle || null, image_url: form.image_url,
      link_url: form.link_url || null, button_text: form.button_text || null,
      sort_order: parseInt(form.sort_order) || 0, is_active: form.is_active,
    }
    if (editing) {
      const { error } = await supabase.from('banners').update(data).eq('id', editing.id)
      if (error) { showToast('Failed to update banner', 'error'); return }
      showToast('Banner updated!', 'success')
    } else {
      const { error } = await supabase.from('banners').insert(data)
      if (error) { showToast('Failed to create banner', 'error'); return }
      showToast('Banner created!', 'success')
    }
    setShowForm(false)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) showToast('Failed to delete', 'error')
    else { showToast('Banner deleted', 'success'); await load() }
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <AdminBackLink />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-wine-800">Banners</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-cream-100 rounded-xl animate-pulse" />)}</div>
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <div key={b.id} className="card overflow-hidden">
              <div className="relative h-40 bg-cream-100">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><ImageIcon size={32} className="text-wine-300" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-cream-50 font-serif text-lg">{b.title}</h3>
                  {b.subtitle && <p className="text-cream-100/80 text-sm">{b.subtitle}</p>}
                </div>
                <span className={`absolute top-3 right-3 badge ${b.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {b.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-xs text-wine-400">Order: {b.sort_order}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className="p-2 rounded-lg hover:bg-cream-200 text-wine-600"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg hover:bg-red-100 text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ImageIcon size={48} className="text-cream-300 mx-auto mb-4" />
          <p className="text-wine-400">No banners yet.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-cream-50 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif text-wine-800">{editing ? 'Edit Banner' : 'Add Banner'}</h2>
              <button onClick={() => setShowForm(false)} className="text-wine-400"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Image URL *</label>
                <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Link URL</label>
                <input type="text" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="input-field" placeholder="/shop" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Button Text</label>
                <input type="text" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} className="input-field" placeholder="Shop Now" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="input-field" />
              </div>
              <label className="flex items-center gap-2 text-sm text-wine-600">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" /> Active
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary flex-1">{editing ? 'Save' : 'Create'}</button>
              <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
