import { useEffect, useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { supabase, type Order } from '../../lib/supabase'
import { formatBDT } from '../../lib/constants'

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items:order_items(*)')
      .order('created_at', { ascending: false })
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }

  const filtered = orders.filter((o) => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || (o.guest_phone ?? '').includes(search)
    const matchesFilter = filter === 'all' || o.status === filter
    return matchesSearch && matchesFilter
  })

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) return
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o)))
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: status as Order['status'] })
    }
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Orders</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or phone..."
            className="input-field pl-10"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field sm:w-48">
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-cream-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100">
              <tr>
                <th className="text-left py-3 px-4 text-wine-700">Order</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Date</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Payment</th>
                <th className="text-left py-3 px-4 text-wine-700">Status</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden md:table-cell">Total</th>
                <th className="text-right py-3 px-4 text-wine-700"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-t border-cream-200 hover:bg-cream-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-wine-800">#{order.order_number}</p>
                    <p className="text-xs text-wine-400">{order.guest_phone ?? 'Registered user'}</p>
                  </td>
                  <td className="py-3 px-4 text-wine-500 hidden md:table-cell">
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 px-4 text-wine-500 hidden md:table-cell capitalize">{order.payment_method}</td>
                  <td className="py-3 px-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-full border-0 cursor-pointer capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 font-semibold text-wine-700 hidden md:table-cell">{formatBDT(order.total_amount)}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg hover:bg-cream-200 text-wine-600">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-wine-400 py-12">No orders found.</p>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-cream-50 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif text-wine-800">Order #{selectedOrder.order_number}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-wine-700 mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm bg-cream-100 rounded-lg p-3">
                      <div>
                        <p className="text-wine-700 font-medium">{item.product_name}</p>
                        <p className="text-xs text-wine-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-wine-700 font-medium">{formatBDT(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-cream-100 rounded-lg p-4">
                <h4 className="text-sm font-medium text-wine-700 mb-2">Shipping Address</h4>
                {(() => {
                  const addr = selectedOrder.shipping_address as Record<string, string>
                  return (
                    <div className="text-sm text-wine-500">
                      <p>{addr?.full_name}</p>
                      <p>{addr?.address_line1}</p>
                      {addr?.address_line2 && <p>{addr.address_line2}</p>}
                      <p>{addr?.city}, {addr?.district}</p>
                      <p>{addr?.phone}</p>
                    </div>
                  )
                })()}
              </div>

              <div className="flex justify-between text-sm text-wine-600">
                <span>Subtotal</span><span>{formatBDT(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-{formatBDT(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-wine-600">
                <span>Shipping</span><span>{formatBDT(selectedOrder.shipping_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-wine-800 border-t border-cream-200 pt-2">
                <span>Total</span><span>{formatBDT(selectedOrder.total_amount)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-wine-500">Payment:</span>
                <span className="text-wine-700 capitalize font-medium">{selectedOrder.payment_method} ({selectedOrder.payment_status})</span>
              </div>
            </div>

            <button onClick={() => setSelectedOrder(null)} className="btn-secondary w-full mt-6">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
