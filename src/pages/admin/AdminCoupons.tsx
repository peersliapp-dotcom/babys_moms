import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react'
import { supabase, type Coupon } from '../../lib/supabase'
import { formatBDT } from '../../lib/constants'
import { useToast } from '../../contexts/ToastContext'

export default function AdminCoupons() {
  const { showToast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState({
    code: '', type: 'percentage' as 'percentage' | 'flat' | 'free_shipping',
    value: '', min_order_amount: '', max_uses: '', expires_at: '', is_active: true,
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons((data as Coupon[]) ?? [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ code: '', type: 'percentage', value: '', min_order_amount: '', max_uses: '', expires_at: '', is_active: true })
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code: c.code, type: c.type, value: String(c.value),
      min_order_amount: String(c.min_order_amount), max_uses: c.max_uses ? String(c.max_uses) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '', is_active: c.is_active,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) { showToast('Code is required', 'error'); return }
    const data = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value) || 0,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    }
    if (editing) {
      const { error } = await supabase.from('coupons').update(data).eq('id', editing.id)
      if (error) { showToast('Failed to update coupon', 'error'); return }
      showToast('Coupon updated!', 'success')
    } else {
      const { error } = await supabase.from('coupons').insert(data)
      if (error) { showToast('Failed to create coupon', 'error'); return }
      showToast('Coupon created!', 'success')
    }
    setShowForm(false)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) showToast('Failed to delete', 'error')
    else { showToast('Coupon deleted', 'success'); await load() }
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-wine-800">Coupons</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-cream-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100">
              <tr>
                <th className="text-left py-3 px-4 text-wine-700">Code</th>
                <th className="text-left py-3 px-4 text-wine-700">Type</th>
                <th className="text-left py-3 px-4 text-wine-700">Value</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Min Order</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Used</th>
                <th className="text-left py-3 px-4 text-wine-700">Status</th>
                <th className="text-right py-3 px-4 text-wine-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-cream-200 hover:bg-cream-50">
                  <td className="py-3 px-4"><span className="font-mono font-medium text-wine-800">{c.code}</span></td>
                  <td className="py-3 px-4 text-wine-500 capitalize">{c.type.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-wine-600">{c.type === 'percentage' ? `${c.value}%` : formatBDT(c.value)}</td>
                  <td className="py-3 px-4 text-wine-500 hidden md:table-cell">{formatBDT(c.min_order_amount)}</td>
                  <td className="py-3 px-4 text-wine-500 hidden md:table-cell">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-cream-200 text-wine-600"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-100 text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && <p className="text-center text-wine-400 py-12">No coupons yet.</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-cream-50 rounded-2xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif text-wine-800">{editing ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="text-wine-400"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Code *</label>
                <div className="relative">
                  <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field pl-10 uppercase" placeholder="WELCOME10" />
                </div>
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} className="input-field">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (BDT)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              {form.type !== 'free_shipping' && (
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Value {form.type === 'percentage' ? '(%)' : '(BDT)'}</label>
                  <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field" placeholder="10" />
                </div>
              )}
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Min Order Amount (BDT)</label>
                <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Max Uses (blank = unlimited)</label>
                <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="input-field" placeholder="1000" />
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Expiry Date</label>
                <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input-field" />
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
