import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, Users, TrendingUp, ChevronRight, Upload, Tag, Image, Settings, UserCircle, Star, Truck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatBDT } from '../../lib/constants'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [productsRes, ordersRes, profilesRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount, order_number, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])

      const { count: orderCount } = await supabase.from('orders').select('id', { count: 'exact', head: true })
      const { data: revenueData } = await supabase.from('orders').select('total_amount')

      const revenue = (revenueData ?? []).reduce((sum, o) => sum + (o as { total_amount: number }).total_amount, 0)

      setStats({
        products: productsRes.count ?? 0,
        orders: orderCount ?? 0,
        customers: profilesRes.count ?? 0,
        revenue,
      })
      setRecentOrders(ordersRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Revenue', value: formatBDT(stats.revenue), icon: TrendingUp, color: 'bg-green-100 text-green-700' },
    { label: 'Orders', value: stats.orders.toString(), icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { label: 'Products', value: stats.products.toString(), icon: Package, color: 'bg-blush-100 text-wine-700' },
    { label: 'Customers', value: stats.customers.toString(), icon: Users, color: 'bg-gold-100 text-gold-700' },
  ]

  return (
    <div className="section-padding py-8 animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <p className="text-2xl font-semibold text-wine-800">{loading ? '—' : stat.value}</p>
            <p className="text-sm text-wine-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/products" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blush-100 flex items-center justify-center"><Package size={22} className="text-wine-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Products</h3><p className="text-sm text-wine-400">Manage catalog & variants</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>

        <Link to="/admin/bulk-upload" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center"><Upload size={22} className="text-gold-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Bulk Upload</h3><p className="text-sm text-wine-400">Upload images in batch</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>

        <Link to="/admin/orders" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><ShoppingBag size={22} className="text-blue-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Orders</h3><p className="text-sm text-wine-400">View & update statuses</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>

        <Link to="/admin/coupons" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><Tag size={22} className="text-green-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Coupons</h3><p className="text-sm text-wine-400">Manage discount codes</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>

        <Link to="/admin/banners" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center"><Image size={22} className="text-purple-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Banners</h3><p className="text-sm text-wine-400">Manage homepage banners</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>

        <Link to="/admin/customers" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center"><UserCircle size={22} className="text-teal-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Customers</h3><p className="text-sm text-wine-400">View customer list</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>

        <Link to="/admin/courier" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><Truck size={22} className="text-blue-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Courier</h3><p className="text-sm text-wine-400">Shipment tracking & integration</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>

        <Link to="/admin/reviews" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center"><Star size={22} className="text-amber-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Reviews</h3><p className="text-sm text-wine-400">Moderate customer reviews</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>

        <Link to="/admin/settings" className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><Settings size={22} className="text-gray-700" /></div>
            <div><h3 className="font-serif text-lg text-wine-800">Site Settings</h3><p className="text-sm text-wine-400">Logo, contact, social links</p></div>
          </div>
          <ChevronRight size={20} className="text-wine-300" />
        </Link>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-serif text-wine-800 mb-4">Recent Orders</h2>
        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id as string} className="flex items-center justify-between py-3 border-b border-cream-200 last:border-0">
                <div>
                  <p className="font-medium text-wine-800 text-sm">#{order.order_number as string}</p>
                  <p className="text-xs text-wine-400">
                    {new Date(order.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full ${
                    (order.status as string) === 'delivered' ? 'bg-green-100 text-green-700' :
                    (order.status as string) === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    (order.status as string) === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status as string}
                  </span>
                  <span className="font-semibold text-wine-700 text-sm">{formatBDT(order.total_amount as number)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-wine-400 text-sm">No orders yet.</p>
        )}
      </div>
    </div>
  )
}
