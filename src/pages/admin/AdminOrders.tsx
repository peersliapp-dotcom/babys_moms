import { useEffect, useState } from 'react'
import { Search, ChevronRight, ShieldCheck, X, Phone, CreditCard, Clock } from 'lucide-react'
import { supabase, type Order } from '../../lib/supabase'
import { formatBDT } from '../../lib/constants'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const

export default function AdminOrders() {
  const { showToast } = useToast()
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => { load() }, [])

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
    const matchesFilter = filter === 'all' || o.status === filter || (filter === 'cod_pending' && o.payment_method === 'cod' && !o.cod_verified)
    return matchesSearch && matchesFilter
  })

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) { showToast('Failed to update status', 'error'); return }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o)))
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: status as Order['status'] })
    }
    showToast('Order status updated', 'success')
  }

  const verifyCOD = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({
      cod_verified: true,
      cod_verified_at: new Date().toISOString(),
      cod_verified_by: session?.user.id,
      status: 'processing',
    }).eq('id', orderId)
    if (error) { showToast('Failed to verify order', 'error'); return }
    showToast('COD order verified! Ready for dispatch.', 'success')
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, cod_verified: true, status: 'processing' as Order['status'] } : o)))
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, cod_verified: true, status: 'processing' as Order['status'] })
    }
  }

  const rejectCOD = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({
      cod_verified: false,
      status: 'cancelled',
    }).eq('id', orderId)
    if (error) { showToast('Failed to reject order', 'error'); return }
    showToast('COD order rejected and cancelled.', 'info')
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, cod_verified: false, status: 'cancelled' as Order['status'] } : o)))
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, cod_verified: false, status: 'cancelled' as Order['status'] })
    }
  }

  const codPendingCount = orders.filter((o) => o.payment_method === 'cod' && !o.cod_verified && o.status !== 'cancelled').length

  return (
    <div className="section-padding py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-wine-800">Orders</h1>
        {codPendingCount > 0 && (
          <span className="badge bg-amber-100 text-amber-700 text-sm">
            {codPendingCount} COD order{codPendingCount > 1 ? 's' : ''} need verification
          </span>
        )}
      </div>

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
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field sm:w-52">
          <option value="all">All Orders</option>
          <option value="cod_pending">COD Needs Verification</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-cream-100 rounded-xl animate-pulse" />)}
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
                <th className="text-left py-3 px-4 text-wine-700 hidden lg:table-cell">Total</th>
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
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      <span className="text-wine-500 capitalize flex items-center gap-1">
                        <CreditCard size={12} /> {order.payment_method}
                      </span>
                      <span className={`text-xs font-medium ${
                        order.payment_status === 'paid' ? 'text-green-600' :
                        order.payment_status === 'failed' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {order.payment_status}
                      </span>
                      {order.payment_method === 'cod' && !order.cod_verified && order.status !== 'cancelled' && (
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <Clock size={10} /> Needs verification
                        </span>
                      )}
                      {order.payment_method === 'cod' && order.cod_verified && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <ShieldCheck size={10} /> Verified
                        </span>
                      )}
                    </div>
                  </td>
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
                  <td className="py-3 px-4 font-semibold text-wine-700 hidden lg:table-cell">{formatBDT(order.total_amount)}</td>
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

            {/* COD Verification Banner */}
            {selectedOrder.payment_method === 'cod' && !selectedOrder.cod_verified && selectedOrder.status !== 'cancelled' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-700 text-sm">COD Verification Required</p>
                    <p className="text-xs text-amber-600 mt-1 mb-3">
                      Call {selectedOrder.guest_phone ?? 'customer'} to confirm this order before dispatch.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyCOD(selectedOrder.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        <ShieldCheck size={14} /> Verify & Approve
                      </button>
                      <button
                        onClick={() => rejectCOD(selectedOrder.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        <X size={14} /> Reject & Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedOrder.payment_method === 'cod' && selectedOrder.cod_verified && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-green-600 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-700">COD Order Verified</p>
                    <p className="text-xs text-green-600">
                      Verified {selectedOrder.cod_verified_at ? new Date(selectedOrder.cod_verified_at).toLocaleString('en-GB') : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="flex justify-between text-sm mb-4 pb-4 border-b border-cream-200">
              <span className="text-wine-500">Payment:</span>
              <span className="text-wine-700 capitalize font-medium">
                {selectedOrder.payment_method} ({selectedOrder.payment_status})
              </span>
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
            </div>

            <button onClick={() => setSelectedOrder(null)} className="btn-secondary w-full mt-6">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
