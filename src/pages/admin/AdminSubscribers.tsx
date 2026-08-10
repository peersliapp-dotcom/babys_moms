import { useEffect, useState } from 'react'
import { Trash2, Search, Download, Mail } from 'lucide-react'
import { supabase, type Subscriber } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import AdminBackLink from '../../components/AdminBackLink'

export default function AdminSubscribers() {
  const { showToast } = useToast()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    setSubscribers((data as Subscriber[]) ?? [])
    setLoading(false)
  }

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return
    const { error } = await supabase.from('subscribers').delete().eq('id', id)
    if (error) {
      showToast('Failed to remove subscriber', 'error')
    } else {
      showToast('Subscriber removed', 'success')
      await load()
    }
  }

  const exportCSV = () => {
    const csv = ['email,subscribed_date']
      .concat(
        filtered.map(
          (s) =>
            `${s.email},${new Date(s.created_at).toLocaleDateString('en-GB')}`
        )
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <AdminBackLink />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-wine-800">Subscribers</h1>
          <p className="text-sm text-wine-400 mt-1">
            {subscribers.length} total subscriber{subscribers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {subscribers.length > 0 && (
          <button
            onClick={exportCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={18} /> Export CSV
          </button>
        )}
      </div>

      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="input-field pl-10 max-w-md"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-cream-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100">
              <tr>
                <th className="text-left py-3 px-4 text-wine-700">Email</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden sm:table-cell">
                  Subscribed
                </th>
                <th className="text-right py-3 px-4 text-wine-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-t border-cream-200 hover:bg-cream-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-wine-400 shrink-0" />
                      <span className="text-wine-800">{sub.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-wine-500 hidden sm:table-cell">
                    {new Date(sub.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-500"
                        aria-label="Remove subscriber"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Mail size={32} className="text-wine-300 mx-auto mb-3" />
          <p className="text-wine-400">No subscribers yet.</p>
        </div>
      )}
    </div>
  )
}
