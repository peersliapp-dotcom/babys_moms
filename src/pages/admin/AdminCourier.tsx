import { useEffect, useState } from 'react'
import { Truck, Package, Search, ExternalLink, Send } from 'lucide-react'
import { supabase, type Order } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { formatBDT } from '../../lib/constants'

export default function AdminCourier() {
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [courierName, setCourierName] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items:order_items(*)')
      .in('status', ['processing', 'shipped'])
      .order('created_at', { ascending: false })
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }

  const filtered = orders.filter((o) =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.guest_phone ?? '').includes(search) ||
    (o.courier_tracking_id ?? '').includes(search)
  )

  const saveTracking = async () => {
    if (!selectedOrder) return
    if (!trackingInput.trim()) { showToast('Enter a tracking ID', 'error'); return }
    const { error } = await supabase
      .from('orders')
      .update({
        courier_name: courierName || 'Manual',
        courier_tracking_id: trackingInput.trim(),
        courier_status: 'shipped',
        status: 'shipped',
      })
      .eq('id', selectedOrder.id)
    if (error) { showToast('Failed to save tracking info', 'error'); return }
    showToast('Tracking info saved! Order marked as shipped.', 'success')
    setSelectedOrder(null)
    setTrackingInput('')
    setCourierName('')
    await load()
  }

  const createShipment = async (order: Order) => {
    const addr = order.shipping_address as Record<string, string>
    const { data, error } = await supabase.functions.invoke('courier-integration', {
      body: JSON.stringify({
        action: 'create_shipment',
        order_data: {
          order_id: order.id,
          order_number: order.order_number,
          recipient_name: addr?.full_name,
          recipient_phone: addr?.phone ?? order.guest_phone,
          recipient_address: `${addr?.address_line1 ?? ''} ${addr?.address_line2 ?? ''}`.trim(),
          recipient_city: addr?.city ?? '',
          amount_to_collect: order.total_amount,
          item_quantity: order.order_items?.length ?? 1,
          item_description: order.order_items?.map((i) => i.product_name).join(', '),
        },
      }),
    })
    if (error || data?.error) {
      showToast(data?.error ?? 'Failed to create shipment', 'error')
      return
    }
    showToast(`Shipment created! Tracking: ${data.tracking_id}`, 'success')
    await load()
  }

  const trackShipment = async (trackingId: string) => {
    const { data, error } = await supabase.functions.invoke('courier-integration', {
      body: JSON.stringify({ action: 'track_shipment', tracking_id: trackingId }),
    })
    if (error || data?.error) {
      showToast(data?.error ?? 'Tracking failed', 'error')
      return
    }
    showToast(`Status: ${data.status}`, 'info')
    await load()
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Courier Management</h1>

      <div className="card p-5 mb-6 bg-blush-50">
        <div className="flex items-start gap-3">
          <Truck className="text-wine-700 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-wine-600">
            <p className="font-medium text-wine-800 mb-1">Courier Integration</p>
            <p>Connect Pathao or Steadfast for automatic shipment creation and live tracking. Configure API keys in Site Settings. You can also manually enter tracking IDs for any courier.</p>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number, phone, or tracking ID..."
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-cream-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((order) => {
            const addr = order.shipping_address as Record<string, string>
            return (
              <div key={order.id} className="card p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-wine-800">#{order.order_number}</p>
                      <span className="text-sm text-wine-400">{formatBDT(order.total_amount)}</span>
                      <span className={`badge text-xs ${order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-wine-500">
                      <p>{addr?.full_name} • {addr?.phone ?? order.guest_phone}</p>
                      <p className="text-xs">{addr?.address_line1}, {addr?.city}, {addr?.district}</p>
                    </div>
                    {order.courier_tracking_id && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="badge bg-cream-200 text-wine-600">{order.courier_name ?? 'Courier'}</span>
                        <span className="text-wine-500">Tracking: {order.courier_tracking_id}</span>
                        {order.courier_status && <span className="text-blue-600">({order.courier_status})</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {!order.courier_tracking_id ? (
                      <>
                        <button
                          onClick={() => createShipment(order)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blush-100 text-wine-700 hover:bg-blush-200 transition-colors text-sm font-medium"
                        >
                          <Send size={14} /> Auto Create
                        </button>
                        <button
                          onClick={() => { setSelectedOrder(order); setTrackingInput(''); setCourierName('') }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cream-200 text-wine-700 hover:bg-cream-300 transition-colors text-sm font-medium"
                        >
                          <Package size={14} /> Manual
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => trackShipment(order.courier_tracking_id!)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        <Search size={14} /> Track
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Truck size={48} className="text-cream-300 mx-auto mb-4" />
          <p className="text-wine-400">No orders ready for shipping.</p>
        </div>
      )}

      {/* Manual tracking modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-cream-50 rounded-2xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-serif text-wine-800 mb-1">Add Tracking Info</h2>
            <p className="text-sm text-wine-400 mb-4">Order #{selectedOrder.order_number}</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Courier Name</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select courier...</option>
                  <option value="Pathao">Pathao</option>
                  <option value="Steadfast">Steadfast</option>
                  <option value="RedX">RedX</option>
                  <option value="Sundarban">Sundarban Courier</option>
                  <option value="Manual">Other / Manual</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-wine-600 mb-1.5 block">Tracking ID</label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="input-field"
                  placeholder="Enter tracking number..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={saveTracking} className="btn-primary flex-1">Save & Mark Shipped</button>
              <button onClick={() => setSelectedOrder(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
