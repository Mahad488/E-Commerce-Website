import { Search, ShoppingCart, Heart, Menu, X, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { API_BASE_URL } from "../config/api";
import type { Product } from "../data/products";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Search Autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/products?search=${encodeURIComponent(
            searchQuery.trim()
          )}`
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.products)) {
          setSearchResults(data.products.slice(0, 5));
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Search autocomplete error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSelectProduct = (productId: number) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    navigate(`/products/${productId}`);
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* Top Announcement */}
      <div className="bg-black text-white text-center py-2 text-xs tracking-wide">
        FREE SHIPPING ON ORDERS OVER $100
      </div>

      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>

            <Link to="/" className="text-2xl font-black tracking-tight">
              NOVA<span className="text-orange-500">.</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-700">
            <Link to="/" className="hover:text-orange-500 transition">
              Home
            </Link>
            <Link to="/categories" className="hover:text-orange-500 transition">
              Categories
            </Link>
            <Link to="/products" className="hover:text-orange-500 transition">
              Shop
            </Link>
            <a href="#footer" className="hover:text-orange-500 transition">
              Contact
            </a>
          </nav>

          {/* Live Search Autocomplete */}
          <div ref={searchRef} className="relative hidden md:block w-72">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2.5">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                className="bg-transparent outline-none text-sm ml-2 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-black"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown Popup */}
            {showSearchDropdown && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-200">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    No matching products found
                  </div>
                ) : (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider border-b bg-gray-50">
                      Search Results ({searchResults.length})
                    </div>
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectProduct(item.id)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-orange-50 transition text-left border-b last:border-0"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {item.category} • ${Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-gray-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/account"
                  className="text-sm font-medium text-gray-700 hover:text-orange-500"
                >
                  Hi, {user?.name}
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Wishlist Link & Counter */}
            <Link
              to="/wishlist"
              className="relative p-1"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart size={21} className="hover:text-red-500 transition" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link & Counter */}
            <Link
              to="/cart"
              className="relative p-1"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart size={22} className="hover:text-orange-500 transition" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="lg:hidden flex flex-col gap-4 py-5 border-t text-sm font-medium">
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link to="/categories" onClick={() => setMenuOpen(false)}>
              Categories
            </Link>
            <Link to="/products" onClick={() => setMenuOpen(false)}>
              Shop
            </Link>
            <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
              Wishlist ({wishlistCount})
            </Link>
            <a href="#footer" onClick={() => setMenuOpen(false)}>
              Contact
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;