import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, ChevronRight, ChevronDown } from 'lucide-react'
import { supabase, type Category } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import AdminBackLink from '../../components/AdminBackLink'

export default function AdminCategories() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    sort_order: '0',
    is_active: true,
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories((data as Category[]) ?? [])
    setLoading(false)
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', image_url: '', parent_id: '', sort_order: '0', is_active: true })
    setShowForm(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      image_url: c.image_url ?? '',
      parent_id: c.parent_id ?? '',
      sort_order: String(c.sort_order),
      is_active: c.is_active,
    })
    setShowForm(true)
  }

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editing ? prev.slug : generateSlug(name),
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required', 'error'); return }
    if (!form.slug.trim()) { showToast('Slug is required', 'error'); return }

    const data = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      parent_id: form.parent_id || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
    }

    if (editing) {
      const { error } = await supabase.from('categories').update(data).eq('id', editing.id)
      if (error) { showToast(error.message || 'Failed to update category', 'error'); return }
      showToast('Category updated!', 'success')
    } else {
      const { error } = await supabase.from('categories').insert(data)
      if (error) { showToast(error.message || 'Failed to create category', 'error'); return }
      showToast('Category created!', 'success')
    }
    setShowForm(false)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Sub-categories will have their parent cleared.')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) showToast(error.message || 'Failed to delete', 'error')
    else { showToast('Category deleted', 'success'); await load() }
  }

  const parentCategories = categories.filter((c) => !c.parent_id)

  return (
    <div className="section-padding py-8 animate-fade-in">
      <AdminBackLink />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-wine-800">Categories</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-cream-100 rounded-xl animate-pulse" />)}
        </div>
      ) : categories.length > 0 ? (
        <div className="space-y-4">
          {parentCategories.map((parent) => {
            const children = categories.filter((c) => c.parent_id === parent.id)
            return (
              <div key={parent.id} className="card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {parent.image_url ? (
                        <img src={parent.image_url} alt={parent.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blush-100 flex items-center justify-center">
                          <span className="text-wine-700 font-serif text-lg">{parent.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-serif text-lg text-wine-800">{parent.name}</h3>
                        <p className="text-xs text-wine-400">/{parent.slug} &middot; Order: {parent.sort_order}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${parent.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {parent.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => openEdit(parent)} className="p-2 rounded-lg hover:bg-cream-200 text-wine-600">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(parent.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="border-t border-cream-200 bg-cream-50/50">
                    {children.map((child) => (
                      <div key={child.id} className="px-5 py-3 flex items-center justify-between border-b border-cream-100 last:border-0">
                        <div className="flex items-center gap-2 pl-4">
                          <ChevronRight size={14} className="text-wine-300" />
                          <span className="text-sm font-medium text-wine-700">{child.name}</span>
                          <span className="text-xs text-wine-400">/{child.slug}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge text-xs ${child.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {child.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <button onClick={() => openEdit(child)} className="p-1.5 rounded-lg hover:bg-cream-200 text-wine-600">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(child.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-wine-400">
          <p className="text-lg mb-2">No categories yet</p>
          <p className="text-sm">Create your first category to organize products.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif text-wine-800">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-cream-200 text-wine-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Baby"
                />
              </div>

              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="input-field"
                  placeholder="e.g. baby"
                />
              </div>

              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Short description of this category"
                />
              </div>

              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Image URL</label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Parent Category</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">None (Top-level)</option>
                  {parentCategories
                    .filter((c) => !editing || c.id !== editing.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-cream-400 text-wine-700 focus:ring-wine-500"
                    />
                    <span className="text-sm text-wine-600">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary flex-1">
                {editing ? 'Update' : 'Create'} Category
              </button>
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
