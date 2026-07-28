import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Package, Truck, Home as HomeIcon } from 'lucide-react'
import { supabase, type Order } from '../lib/supabase'
import { formatBDT } from '../lib/constants'

export default function OrderConfirmation() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items:order_items(*)')
        .eq('order_number', orderNumber)
        .maybeSingle()
      setOrder(data as Order | null)
      setLoading(false)
    }
    if (orderNumber) load()
  }, [orderNumber])

  if (loading) {
    return (
      <div className="section-padding py-20 text-center">
        <div className="w-8 h-8 border-2 border-blush-300 border-t-wine-700 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="section-padding py-20 text-center">
        <h1 className="text-2xl font-serif text-wine-800 mb-4">Order not found</h1>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    )
  }

  const steps = [
    { icon: CheckCircle, label: 'Order Placed', done: true },
    { icon: Package, label: 'Processing', done: false },
    { icon: Truck, label: 'Shipped', done: false },
    { icon: HomeIcon, label: 'Delivered', done: false },
  ]

  return (
    <div className="section-padding py-12 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-serif text-wine-800 mb-2">Thank You!</h1>
        <p className="text-wine-500">Your order has been placed successfully.</p>
        <p className="text-wine-700 font-medium mt-2">Order #{order.order_number}</p>
      </div>

      {/* Tracking Steps */}
      <div className="flex justify-between mb-10 px-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                step.done ? 'bg-green-500 text-white' : 'bg-cream-200 text-wine-300'
              }`}
            >
              <step.icon size={20} />
            </div>
            <span className={`text-xs ${step.done ? 'text-wine-700 font-medium' : 'text-wine-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Order Details */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-wine-800 mb-4">Order Details</h2>
        <div className="space-y-3">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="text-wine-700 font-medium">{item.product_name}</p>
                <p className="text-wine-400 text-xs">
                  Qty: {item.quantity}
                  {item.variant_details && (item.variant_details as Record<string, string>).size && ` · Size: ${(item.variant_details as Record<string, string>).size}`}
                </p>
              </div>
              <span className="text-wine-700 font-medium">{formatBDT(item.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-cream-200 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-wine-600">
            <span>Subtotal</span>
            <span>{formatBDT(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatBDT(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-wine-600">
            <span>Shipping</span>
            <span>{order.shipping_amount === 0 ? 'Free' : formatBDT(order.shipping_amount)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-wine-800 border-t border-cream-200 pt-2">
            <span>Total</span>
            <span>{formatBDT(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-wine-800 mb-3">Shipping Address</h2>
        <div className="text-sm text-wine-500">
          {(() => {
            const addr = order.shipping_address as Record<string, string>
            return (
              <>
                <p className="font-medium text-wine-700">{addr?.full_name}</p>
                <p>{addr?.address_line1}</p>
                {addr?.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr?.city}, {addr?.district}</p>
                <p>{addr?.phone}</p>
              </>
            )
          })()}
        </div>
      </div>

      {/* Payment Info */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-serif text-wine-800 mb-3">Payment</h2>
        <div className="flex justify-between text-sm">
          <span className="text-wine-600 capitalize">{order.payment_method}</span>
          <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
            {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
          </span>
        </div>
        {order.payment_method !== 'cod' && order.payment_status === 'pending' && (
          <p className="text-xs text-wine-400 mt-2">
            You will receive a payment link via SMS/email shortly. Please complete the payment to confirm your order.
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Link to="/shop" className="btn-primary flex-1 text-center">Continue Shopping</Link>
        {order.user_id && <Link to="/account" className="btn-outline flex-1 text-center">View Orders</Link>}
      </div>
    </div>
  )
}
