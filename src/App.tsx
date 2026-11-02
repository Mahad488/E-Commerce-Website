import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import CurrencySidebar from "./components/CurrencySidebar";
import CartDrawer from "./components/CartDrawer";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import CategoriesPage from "./pages/CategoriesPage";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";

// Less-visited pages are split into their own chunks and loaded on demand.
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Account = lazy(() => import("./pages/Account"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Contact = lazy(() => import("./pages/Contact"));
const Faq = lazy(() => import("./pages/Faq"));
const About = lazy(() => import("./pages/About"));
const Legal = lazy(() => import("./pages/Legal"));

// The admin portal is large and only used by staff.
const Admin = lazy(() => import("../admin/frontend/Admin"));
const AdminLogin = lazy(() => import("../admin/frontend/AdminLogin"));
const AdminPortalData = lazy(() => import("../admin/frontend/AdminPortalData"));

function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("nova_admin_token");
  if (!token || token === "demo_admin_preview_token") {
    return <Navigate to="/admin-login" replace />;
  }
  return <>{children}</>;
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            <CurrencyProvider>
              <CurrencySidebar />
              <BrowserRouter>
                <ScrollToTop />
                <CartDrawer />
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<Faq />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/privacy" element={<Legal kind="privacy" />} />
                    <Route path="/terms" element={<Legal kind="terms" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedAdminRoute>
                          <Admin />
                        </ProtectedAdminRoute>
                      }
                    />
                    <Route
                      path="/admin-data"
                      element={
                        <ProtectedAdminRoute>
                          <AdminPortalData />
                        </ProtectedAdminRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </CurrencyProvider>
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
