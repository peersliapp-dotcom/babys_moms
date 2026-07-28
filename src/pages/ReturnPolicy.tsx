import { RefreshCw, Package, AlertCircle } from 'lucide-react'

export default function ReturnPolicy() {
  return (
    <div className="section-padding py-12 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Returns & Exchange</h1>

      <div className="space-y-8">
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center">
              <RefreshCw size={20} className="text-wine-700" />
            </div>
            <h2 className="text-xl font-serif text-wine-800">7-Day Return Policy</h2>
          </div>
          <p className="text-sm text-wine-600 leading-relaxed mb-3">
            We want you to love every purchase. If you're not completely satisfied, you can return or exchange
            unworn, unwashed items within 7 days of delivery.
          </p>
          <ul className="space-y-2 text-sm text-wine-600">
            <li>Items must be in original condition with tags attached.</li>
            <li>Items must be unworn, unwashed, and free of odors or stains.</li>
            <li>Original packaging must be included where applicable.</li>
          </ul>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center">
              <Package size={20} className="text-wine-700" />
            </div>
            <h2 className="text-xl font-serif text-wine-800">How to Return</h2>
          </div>
          <ol className="space-y-3 text-sm text-wine-600 list-decimal list-inside">
            <li>Email us at <strong>hello@babysandmoms.com</strong> with your order number and reason for return.</li>
            <li>We'll send you a return authorization and instructions within 24 hours.</li>
            <li>Pack the items securely in their original packaging.</li>
            <li>Ship the package to the address provided in the return instructions.</li>
            <li>Refunds are processed within 5–7 business days of receiving the returned items.</li>
          </ol>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-wine-700" />
            </div>
            <h2 className="text-xl font-serif text-wine-800">Non-Returnable Items</h2>
          </div>
          <ul className="space-y-2 text-sm text-wine-600">
            <li>Items on clearance or final sale.</li>
            <li>Undergarments and hygiene-sensitive products.</li>
            <li>Items that have been worn, washed, or altered.</li>
          </ul>
        </section>

        <div className="bg-blush-50 rounded-xl p-6 text-sm text-wine-600">
          <p><strong>Exchange:</strong> Need a different size? We offer free exchanges within 7 days. Just contact us and we'll arrange it.</p>
          <p className="mt-2"><strong>Refund Method:</strong> Refunds are issued to the original payment method. For COD orders, refunds are processed via bKash or bank transfer.</p>
        </div>
      </div>
    </div>
  )
}
