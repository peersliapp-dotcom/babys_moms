import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import Account from './pages/Account'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Wishlist from './pages/Wishlist'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminBulkUpload from './pages/admin/AdminBulkUpload'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminBanners from './pages/admin/AdminBanners'
import AdminSettings from './pages/admin/AdminSettings'
import AdminCustomers from './pages/admin/AdminCustomers'
import About from './pages/About'
import SizeGuide from './pages/SizeGuide'
import ShippingPolicy from './pages/ShippingPolicy'
import ReturnPolicy from './pages/ReturnPolicy'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:categorySlug" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<About />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/returns" element={<ReturnPolicy />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bulk-upload"
            element={
              <AdminRoute>
                <AdminBulkUpload />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/coupons"
            element={<AdminRoute><AdminCoupons /></AdminRoute>}
          />
          <Route
            path="/admin/banners"
            element={<AdminRoute><AdminBanners /></AdminRoute>}
          />
          <Route
            path="/admin/settings"
            element={<AdminRoute><AdminSettings /></AdminRoute>}
          />
          <Route
            path="/admin/customers"
            element={<AdminRoute><AdminCustomers /></AdminRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
