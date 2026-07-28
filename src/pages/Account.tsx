import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Heart, MapPin, User as UserIcon, LogOut, ChevronRight, Truck, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase, type Order, type Address, type Product, type Wishlist as WishlistType } from '../lib/supabase'
import { formatBDT } from '../lib/constants'

type Tab = 'orders' | 'profile' | 'addresses' | 'wishlist'

export default function Account() {
  const { session, profile, signOut, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  useEffect(() => {
    async function load() {
      if (!session) return
      const [ordersRes, addrRes, wishRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, order_items:order_items(*)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wishlists')
          .select('*, product:products(*, category:categories(*), variants:product_variants(*))')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
      ])
      setOrders((ordersRes.data as Order[]) ?? [])
      setAddresses((addrRes.data as Address[]) ?? [])
      setWishlistItems((wishRes.data as WishlistType[]) ?? [])
      setLoading(false)
    }
    load()
  }, [session])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleSaveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', session!.user.id)
    if (error) {
      showToast('Failed to update profile', 'error')
    } else {
      showToast('Profile updated!', 'success')
      await refreshProfile()
      setEditingProfile(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: 'orders', label: 'My Orders', icon: Package },
    { key: 'profile', label: 'Profile', icon: UserIcon },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
  ]

  const statusIcons: Record<string, typeof Package> = {
    pending: Package,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-wine-800">My Account</h1>
          <p className="text-wine-400 text-sm mt-1">{session?.user.email}</p>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-wine-500 hover:text-red-500 transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="flex lg:flex-col gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.key ? 'bg-wine-700 text-cream-50' : 'text-wine-600 hover:bg-cream-100'
                }`}
              >
                <t.icon size={18} /> {t.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Orders */}
          {tab === 'orders' && (
            <div>
              <h2 className="text-xl font-serif text-wine-800 mb-4">Order History</h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-24 bg-cream-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const StatusIcon = statusIcons[order.status] ?? Package
                    return (
                      <Link
                        to={`/order-confirmation/${order.order_number}`}
                        key={order.id}
                        className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blush-100 flex items-center justify-center">
                            <StatusIcon size={20} className="text-wine-600" />
                          </div>
                          <div>
                            <p className="font-medium text-wine-800">#{order.order_number}</p>
                            <p className="text-sm text-wine-400">
                              {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <span className={`text-xs font-medium capitalize mt-0.5 inline-block ${
                              order.status === 'delivered' ? 'text-green-600' :
                              order.status === 'shipped' ? 'text-blue-600' :
                              order.status === 'cancelled' ? 'text-red-500' : 'text-amber-600'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-wine-700">{formatBDT(order.total_amount)}</p>
                          <p className="text-xs text-wine-400">{order.order_items?.length ?? 0} items</p>
                        </div>
                        <ChevronRight size={18} className="text-wine-300 ml-2" />
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={48} className="text-cream-300 mx-auto mb-4" />
                  <p className="text-wine-400 mb-4">No orders yet</p>
                  <Link to="/shop" className="btn-primary">Start Shopping</Link>
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-xl font-serif text-wine-800 mb-4">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={editingProfile ? fullName : (profile?.full_name ?? '')}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!editingProfile}
                    className="input-field disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Phone</label>
                  <input
                    type="tel"
                    value={editingProfile ? phone : (profile?.phone ?? '')}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!editingProfile}
                    className="input-field disabled:opacity-60"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="text-sm text-wine-600 mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={session?.user.email ?? ''}
                    disabled
                    className="input-field opacity-60"
                  />
                </div>
                {editingProfile ? (
                  <div className="flex gap-3">
                    <button onClick={handleSaveProfile} className="btn-primary">Save Changes</button>
                    <button onClick={() => { setEditingProfile(false); setFullName(profile?.full_name ?? ''); setPhone(profile?.phone ?? '') }} className="btn-outline">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingProfile(true)} className="btn-secondary">Edit Profile</button>
                )}
              </div>
            </div>
          )}

          {/* Addresses */}
          {tab === 'addresses' && (
            <div>
              <h2 className="text-xl font-serif text-wine-800 mb-4">Saved Addresses</h2>
              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="card p-5">
                      {addr.is_default && <span className="badge bg-blush-100 text-wine-700 mb-2">Default</span>}
                      <p className="font-medium text-wine-800">{addr.full_name}</p>
                      <p className="text-sm text-wine-500 mt-1">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-sm text-wine-500">{addr.address_line2}</p>}
                      <p className="text-sm text-wine-500">{addr.city}, {addr.district}</p>
                      <p className="text-sm text-wine-500">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin size={48} className="text-cream-300 mx-auto mb-4" />
                  <p className="text-wine-400">No saved addresses yet. They will appear here after your first order.</p>
                </div>
              )}
            </div>
          )}

          {/* Wishlist */}
          {tab === 'wishlist' && (
            <div>
              <h2 className="text-xl font-serif text-wine-800 mb-4">My Wishlist</h2>
              {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {wishlistItems.map((item) => (
                    <Link key={item.id} to={`/product/${(item.product as Product)?.slug ?? ''}`} className="card group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-cream-100 rounded-t-2xl">
                        <img src={(item.product as Product)?.images?.[0] ?? 'https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg'} alt={(item.product as Product)?.name ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-serif text-sm text-wine-800 line-clamp-1">{(item.product as Product)?.name ?? ''}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart size={48} className="text-cream-300 mx-auto mb-4" />
                  <p className="text-wine-400 mb-4">Your wishlist is empty</p>
                  <Link to="/shop" className="btn-primary">Browse Products</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
