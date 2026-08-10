import { useEffect, useState } from 'react'
import { Search, Mail, Phone, ShoppingBag } from 'lucide-react'
import { supabase, type Profile, type Order } from '../../lib/supabase'
import { formatBDT } from '../../lib/constants'
import AdminBackLink from '../../components/AdminBackLink'

export default function AdminCustomers() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [orderCounts, setOrderCounts] = useState<Record<string, { count: number; total: number }>>({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const profileList = (data as Profile[]) ?? []
    setProfiles(profileList)

    // Get order counts per user
    const { data: ordersData } = await supabase.from('orders').select('user_id, total_amount').not('user_id', 'is', null)
    const counts: Record<string, { count: number; total: number }> = {}
    for (const o of (ordersData ?? []) as Pick<Order, 'user_id' | 'total_amount'>[]) {
      if (!o.user_id) continue
      if (!counts[o.user_id]) counts[o.user_id] = { count: 0, total: 0 }
      counts[o.user_id].count++
      counts[o.user_id].total += o.total_amount
    }
    setOrderCounts(counts)
    setLoading(false)
  }

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase()
    return (p.full_name ?? '').toLowerCase().includes(q) || p.id.includes(q)
  })

  // Fetch emails from auth - we can't directly, so we show what we have from profiles
  return (
    <div className="section-padding py-8 animate-fade-in">
      <AdminBackLink />
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Customers</h1>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="input-field pl-10 max-w-md" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-cream-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100">
              <tr>
                <th className="text-left py-3 px-4 text-wine-700">Name</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Phone</th>
                <th className="text-left py-3 px-4 text-wine-700">Role</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Orders</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Total Spent</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stats = orderCounts[p.id] ?? { count: 0, total: 0 }
                return (
                  <tr key={p.id} className="border-t border-cream-200 hover:bg-cream-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blush-200 flex items-center justify-center text-wine-700 font-medium text-sm">
                          {(p.full_name ?? '?')[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-wine-800">{p.full_name || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-wine-500 hidden md:table-cell">
                      {p.phone ? <span className="flex items-center gap-1"><Phone size={13} /> {p.phone}</span> : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${p.role === 'admin' ? 'bg-gold-100 text-gold-700' : 'bg-cream-200 text-wine-600'}`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-wine-500 hidden md:table-cell">
                      <span className="flex items-center gap-1"><ShoppingBag size={13} /> {stats.count}</span>
                    </td>
                    <td className="py-3 px-4 text-wine-600 font-medium hidden md:table-cell">{formatBDT(stats.total)}</td>
                    <td className="py-3 px-4 text-wine-400 hidden md:table-cell">
                      {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-wine-400 py-12">No customers found.</p>}
        </div>
      )}
    </div>
  )
}
