import { Search, ShoppingCart, Heart, Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { API_BASE_URL } from "../config/api";
import type { Product } from "../data/products";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Animation bump triggers
  const [cartAnimate, setCartAnimate] = useState(false);
  const [wishlistAnimate, setWishlistAnimate] = useState(false);

  // Search Autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Scroll detection for sticky glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trigger bounce when cartCount updates
  useEffect(() => {
    if (cartCount > 0) {
      setCartAnimate(true);
      const timer = setTimeout(() => setCartAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  // Trigger bounce when wishlistCount updates
  useEffect(() => {
    if (wishlistCount > 0) {
      setWishlistAnimate(true);
      const timer = setTimeout(() => setWishlistAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [wishlistCount]);

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

  const tickerItems = [
    "✨ FREE WORLDWIDE SHIPPING ON ORDERS OVER $100",
    "⚡ FLASH SALE: UP TO 40% OFF THIS SEASON",
    "🛡️ 30-DAY MONEY-BACK SATISFACTION GUARANTEE",
    "⭐ JOIN 10,000+ HAPPY CUSTOMERS TODAY",
  ];

  return (
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-md border-b border-gray-200/70"
          : "bg-white border-b border-gray-100"
      }`}
    >
      {/* Top Animated Announcement Marquee */}
      <div className="bg-neutral-950 text-white overflow-hidden py-1.5 text-xs font-medium tracking-wide">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-12">
          {/* Double items for continuous seamless loop */}
          {[...tickerItems, ...tickerItems].map((text, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-3 text-[11px] font-semibold text-gray-200"
            >
              <Sparkles size={12} className="text-orange-400 shrink-0" />
              {text}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>

            <Link
              to="/"
              className="group text-2xl font-black tracking-tight flex items-center"
            >
              <span className="text-gray-950 transition-colors group-hover:text-orange-600">
                NOVA
              </span>
              <span className="text-orange-500 text-3xl font-black group-hover:scale-125 transition-transform inline-block">
                .
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links with animated indicator */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-700">
            <Link
              to="/"
              className="nav-hover-indicator hover:text-orange-600 transition-colors py-1"
            >
              Home
            </Link>
            <Link
              to="/categories"
              className="nav-hover-indicator hover:text-orange-600 transition-colors py-1"
            >
              Categories
            </Link>
            <Link
              to="/products"
              className="nav-hover-indicator hover:text-orange-600 transition-colors py-1"
            >
              Shop
            </Link>
            <Link
              to="/products?sale=true"
              className="nav-hover-indicator hover:text-orange-600 transition-colors py-1 flex items-center gap-1.5"
            >
              <span>Deals</span>
              <span className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                SALE
              </span>
            </Link>
            <a
              href="#footer"
              className="nav-hover-indicator hover:text-orange-600 transition-colors py-1"
            >
              Contact
            </a>
          </nav>

          {/* Live Search Autocomplete */}
          <div ref={searchRef} className="relative hidden md:block w-72">
            <div className="flex items-center bg-gray-100/90 hover:bg-gray-100 rounded-full px-4 py-2.5 transition focus-within:ring-2 focus-within:ring-orange-500 focus-within:bg-white shadow-inner">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                className="bg-transparent outline-none text-sm ml-2 w-full text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-black transition"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown Popup */}
            {showSearchDropdown && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 transform transition-all duration-200">
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
                        className="group w-full p-3 flex items-center gap-3 hover:bg-orange-50/80 transition text-left border-b last:border-0"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0 group-hover:scale-105 transition duration-300"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate group-hover:text-orange-600 transition">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {item.category} • ${Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-gray-400 shrink-0 group-hover:translate-x-1 group-hover:text-orange-500 transition-all"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User & Cart Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/account"
                  className="text-sm font-semibold text-gray-700 hover:text-orange-600 transition"
                >
                  Hi, {user?.name?.split(" ")[0]}
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-orange-600 transition px-2 py-1"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="rounded-full bg-black px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-orange-500 hover:shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Wishlist Link & Animated Counter */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-full hover:bg-rose-50 text-gray-700 hover:text-rose-500 transition-all duration-200"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart size={21} className="transition-transform active:scale-90" />
              {wishlistCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 bg-rose-500 text-white rounded-full min-w-5 h-5 px-1 flex items-center justify-center text-[10px] font-bold shadow-sm ${
                    wishlistAnimate ? "animate-heart-pop" : ""
                  }`}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link & Animated Counter */}
            <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-all duration-200"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart size={21} className="transition-transform active:scale-90" />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 bg-orange-500 text-white rounded-full min-w-5 h-5 px-1 flex items-center justify-center text-[10px] font-bold shadow-sm ${
                    cartAnimate ? "animate-cart-bump" : ""
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Animated Mobile Navigation Menu */}
        {menuOpen && (
          <nav className="lg:hidden flex flex-col gap-3 py-5 border-t border-gray-100 text-sm font-medium animate-in slide-in-from-top-4 duration-300">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition"
            >
              Home
            </Link>
            <Link
              to="/categories"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition"
            >
              Categories
            </Link>
            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition"
            >
              Shop Catalog
            </Link>
            <Link
              to="/products?sale=true"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-between font-bold text-rose-600"
            >
              <span>Deals & Discounts</span>
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                SALE 🔥
              </span>
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-between"
            >
              <span>Wishlist</span>
              <span className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {wishlistCount}
              </span>
            </Link>
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition flex items-center justify-between"
            >
              <span>Shopping Cart</span>
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {cartCount}
              </span>
            </Link>
            <a
              href="#footer"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Contact Us
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}