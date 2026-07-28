import { Truck, Clock, MapPin } from 'lucide-react'

export default function ShippingPolicy() {
  return (
    <div className="section-padding py-12 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Shipping & Delivery</h1>

      <div className="space-y-8">
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center">
              <Truck size={20} className="text-wine-700" />
            </div>
            <h2 className="text-xl font-serif text-wine-800">Delivery Times</h2>
          </div>
          <ul className="space-y-2 text-sm text-wine-600">
            <li><strong>Inside Dhaka:</strong> 1–2 business days</li>
            <li><strong>Dhaka Suburbs:</strong> 2–3 business days</li>
            <li><strong>Outside Dhaka:</strong> 3–5 business days</li>
            <li>Orders placed after 5 PM will be processed the next business day.</li>
          </ul>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center">
              <MapPin size={20} className="text-wine-700" />
            </div>
            <h2 className="text-xl font-serif text-wine-800">Shipping Costs</h2>
          </div>
          <ul className="space-y-2 text-sm text-wine-600">
            <li><strong>Inside Dhaka:</strong> ৳60</li>
            <li><strong>Dhaka Suburbs (Narayanganj, Gazipur, etc.):</strong> ৳80</li>
            <li><strong>Outside Dhaka:</strong> ৳100–120 (varies by district)</li>
            <li><strong>Free Shipping:</strong> On all orders over ৳3,000</li>
          </ul>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center">
              <Clock size={20} className="text-wine-700" />
            </div>
            <h2 className="text-xl font-serif text-wine-800">Order Processing</h2>
          </div>
          <ul className="space-y-2 text-sm text-wine-600">
            <li>Orders are processed within 24 hours of placement.</li>
            <li>You will receive an SMS with your tracking number once your order is shipped.</li>
            <li>Delivery times may vary during holidays and promotional events.</li>
            <li>We deliver through trusted courier partners across all 64 districts of Bangladesh.</li>
          </ul>
        </section>

        <div className="bg-blush-50 rounded-xl p-6 text-sm text-wine-600">
          <p>For any delivery-related questions, please contact us at <strong>hello@babysandmoms.com</strong> or call <strong>+880 1700 000000</strong>.</p>
        </div>
      </div>
    </div>
  )
}
