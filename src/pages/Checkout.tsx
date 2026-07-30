import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Check, Shield, Lock } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { formatBDT, BD_DISTRICTS, getShippingCost, FREE_SHIPPING_THRESHOLD, PAYMENT_METHODS } from '../lib/constants'

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { session } = useAuth()
  const { showToast } = useToast()

  const discount = (location.state as { discount?: number })?.discount ?? 0
  const couponCode = (location.state as { couponCode?: string })?.couponCode ?? null

  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping')
  const [processing, setProcessing] = useState(false)
  const [shippingInfo, setShippingInfo] = useState({
    full_name: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: 'Dhaka',
    division: 'Dhaka',
    postal_code: '',
    notes: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card' | 'cod'>('cod')

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : getShippingCost(shippingInfo.district)
  const total = subtotal - discount + shippingCost

  const validateShipping = () => {
    const required = ['full_name', 'phone', 'address_line1', 'city', 'district']
    for (const field of required) {
      if (!shippingInfo[field as keyof typeof shippingInfo].trim()) {
        showToast(`Please fill in ${field.replace('_', ' ')}`, 'error')
        return false
      }
    }
    if (!session && !shippingInfo.email.trim()) {
      showToast('Please enter your email', 'error')
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      showToast('Your cart is empty', 'error')
      return
    }

    setProcessing(true)
    try {
      const orderData = {
        user_id: session?.user.id ?? null,
        guest_email: !session ? shippingInfo.email : null,
        guest_phone: shippingInfo.phone,
        status: 'pending' as const,
        payment_method: paymentMethod,
        payment_status: 'pending',
        subtotal,
        discount_amount: discount,
        shipping_amount: shippingCost,
        total_amount: total,
        coupon_code: couponCode,
        shipping_address: {
          full_name: shippingInfo.full_name,
          phone: shippingInfo.phone,
          address_line1: shippingInfo.address_line1,
          address_line2: shippingInfo.address_line2,
          city: shippingInfo.city,
          district: shippingInfo.district,
          division: shippingInfo.division,
          postal_code: shippingInfo.postal_code,
        },
        notes: shippingInfo.notes || null,
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = items.map((item) => {
        const variant = 'variant' in item ? item.variant : undefined
        return {
          order_id: order.id,
          variant_id: item.variant_id,
          product_name: variant?.product?.name ?? 'Product',
          variant_details: { size: variant?.size, color: variant?.color },
          quantity: item.quantity,
          unit_price: variant?.price ?? 0,
          total_price: (variant?.price ?? 0) * item.quantity,
        }
      })

      await supabase.from('order_items').insert(orderItems)

      // Decrement stock via edge function
      const stockItems = items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      }))
      await supabase.functions.invoke('decrement-stock', {
        body: JSON.stringify({ order_id: order.id, items: stockItems }),
      })

      if (session) {
        await clearCart()
      }

      // For online payments, create payment session and redirect
      if (paymentMethod !== 'cod') {
        const { data: payData, error: payError } = await supabase.functions.invoke('payment-gateway', {
          body: JSON.stringify({
            action: 'create_payment',
            order_id: order.id,
            payment_method: paymentMethod,
            amount: total,
            order_number: order.order_number,
            customer_info: {
              full_name: shippingInfo.full_name,
              phone: shippingInfo.phone,
              email: shippingInfo.email || 'noreply@example.com',
              address: shippingInfo.address_line1,
              city: shippingInfo.city,
            },
          }),
        })

        if (payError || payData?.error) {
          showToast(payData?.error ?? 'Payment gateway error. Order placed with pending payment.', 'error')
          navigate(`/order-confirmation/${order.order_number}`)
          return
        }

        // Redirect to payment gateway
        if (payData?.payment_url) {
          window.location.href = payData.payment_url
          return
        }

        // If no URL (sandbox not configured), go to confirmation with pending payment
        showToast('Payment gateway not configured. Order placed with pending payment.', 'info')
      }

      navigate(`/order-confirmation/${order.order_number}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to place order. Please try again.'
      showToast(msg, 'error')
    }
    setProcessing(false)
  }

  if (items.length === 0) {
    return (
      <div className="section-padding py-20 text-center">
        <h1 className="text-2xl font-serif text-wine-800 mb-4">Your cart is empty</h1>
        <button onClick={() => navigate('/shop')} className="btn-primary">Start Shopping</button>
      </div>
    )
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {[
          { key: 'shipping', label: 'Shipping' },
          { key: 'payment', label: 'Payment' },
          { key: 'review', label: 'Review' },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                step === s.key || (['shipping', 'payment', 'review'].indexOf(step) > i)
                  ? 'bg-wine-700 text-cream-50'
                  : 'bg-cream-200 text-wine-400'
              }`}
            >
              {['shipping', 'payment', 'review'].indexOf(step) > i ? <Check size={14} /> : i + 1}
            </div>
            <span className={step === s.key ? 'text-wine-700 font-medium' : 'text-wine-400'}>{s.label}</span>
            {i < 2 && <ChevronRight size={14} className="text-wine-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 'shipping' && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-xl font-serif text-wine-800 mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    value={shippingInfo.full_name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, full_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Phone *</label>
                  <input
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    className="input-field"
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>
                {!session && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-wine-600 mb-1.5 block">Email *</label>
                    <input
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="text-sm text-wine-600 mb-1.5 block">Address Line 1 *</label>
                  <input
                    type="text"
                    value={shippingInfo.address_line1}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address_line1: e.target.value })}
                    className="input-field"
                    placeholder="House #, Road #"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-wine-600 mb-1.5 block">Address Line 2</label>
                  <input
                    type="text"
                    value={shippingInfo.address_line2}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address_line2: e.target.value })}
                    className="input-field"
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">City / Area *</label>
                  <input
                    type="text"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">District *</label>
                  <select
                    value={shippingInfo.district}
                    onChange={(e) => {
                      const dist = BD_DISTRICTS.find((d) => d.district === e.target.value)
                      setShippingInfo({
                        ...shippingInfo,
                        district: e.target.value,
                        division: dist?.division ?? shippingInfo.division,
                      })
                    }}
                    className="input-field"
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d.district} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Postal Code</label>
                  <input
                    type="text"
                    value={shippingInfo.postal_code}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, postal_code: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Division</label>
                  <input
                    type="text"
                    value={shippingInfo.division}
                    disabled
                    className="input-field opacity-60"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-wine-600 mb-1.5 block">Order Notes (optional)</label>
                  <textarea
                    value={shippingInfo.notes}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                    className="input-field min-h-20 resize-none"
                    placeholder="Delivery instructions, gift message, etc."
                  />
                </div>
              </div>
              <button
                onClick={() => validateShipping() && setStep('payment')}
                className="btn-primary w-full mt-6"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-xl font-serif text-wine-800 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === method.id
                        ? 'border-wine-700 bg-blush-50'
                        : 'border-cream-300 hover:border-blush-200'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-wine-800">{method.name}</h4>
                      <p className="text-sm text-wine-400">{method.description}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === method.id ? 'border-wine-700 bg-wine-700' : 'border-cream-400'
                      }`}
                    >
                      {paymentMethod === method.id && <Check size={12} className="text-cream-50" />}
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === 'cod' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 text-sm text-amber-700">
                  <p className="font-medium mb-1">Cash on Delivery</p>
                  <p>Pay in cash when your order is delivered. A verification call may be made to confirm your order before dispatch.</p>
                </div>
              )}

              {paymentMethod !== 'cod' && (
                <div className="bg-cream-100 rounded-xl p-4 mt-4 text-sm text-wine-500 flex items-start gap-2">
                  <Lock size={16} className="text-wine-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-wine-700">Secure Payment</p>
                    <p className="mt-0.5">You will be redirected to {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}'s secure payment page. Your payment is protected with bank-level encryption.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('shipping')} className="btn-outline flex-1">Back</button>
                <button onClick={() => setStep('review')} className="btn-primary flex-1">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-xl font-serif text-wine-800 mb-4">Review Your Order</h2>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-wine-700 mb-2">Shipping To</h4>
                <div className="text-sm text-wine-500 bg-cream-100 rounded-xl p-4">
                  <p className="font-medium text-wine-700">{shippingInfo.full_name}</p>
                  <p>{shippingInfo.address_line1}</p>
                  {shippingInfo.address_line2 && <p>{shippingInfo.address_line2}</p>}
                  <p>{shippingInfo.city}, {shippingInfo.district}</p>
                  <p>{shippingInfo.phone}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-wine-700 mb-2">Payment Method</h4>
                <div className="text-sm text-wine-500 bg-cream-100 rounded-xl p-4 flex items-center gap-2">
                  <Shield size={16} className="text-wine-400" />
                  {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name}
                  {paymentMethod === 'cod' && <span className="text-xs text-amber-600">(Verification required before dispatch)</span>}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-wine-700 mb-2">Items</h4>
                <div className="space-y-2">
                  {items.map((item) => {
                    const variant = 'variant' in item ? item.variant : undefined
                    return (
                      <div key={(item as { id?: string }).id ?? item.variant_id} className="flex justify-between text-sm">
                        <span className="text-wine-600">
                          {variant?.product?.name ?? 'Product'} × {item.quantity}
                          {variant?.size && ` (${variant.size})`}
                        </span>
                        <span className="text-wine-700 font-medium">
                          {formatBDT((variant?.price ?? 0) * item.quantity)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('payment')} className="btn-outline flex-1">Back</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />
                      {paymentMethod === 'cod' ? 'Placing Order...' : 'Redirecting to payment...'}
                    </>
                  ) : (
                    paymentMethod === 'cod' ? `Place Order · ${formatBDT(total)}` : `Pay ${formatBDT(total)}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-serif text-wine-800 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-wine-600">
                <span>Subtotal ({items.length} items)</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatBDT(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-wine-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : formatBDT(shippingCost)}</span>
              </div>
            </div>
            <div className="flex justify-between text-lg font-semibold text-wine-800 border-t border-cream-200 pt-4 mt-4">
              <span>Total</span>
              <span>{formatBDT(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
