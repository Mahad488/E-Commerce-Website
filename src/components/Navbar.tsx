import {
  Search,
  ShoppingCart,
  UserRound,
  Heart,
  Menu,
  X,
} from "lucide-react";

import { useState } from "react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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

            <a href="/" className="text-2xl font-black tracking-tight">
              NOVA<span className="text-orange-500">.</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-700">
            <a href="/" className="hover:text-orange-500 transition">Home</a>
            <a href="#categories" className="hover:text-orange-500 transition">Categories</a>
            <a href="/products" className="hover:text-orange-500 transition">Shop</a>
            <a href="#footer" className="hover:text-orange-500 transition">Contact</a>
          </nav>

          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2.5 w-64">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              className="bg-transparent outline-none text-sm ml-2 w-full"
            />
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">

            <button aria-label="Account">
              <UserRound size={21} className="hover:text-orange-500" />
            </button>

            <button aria-label="Wishlist">
              <Heart size={21} className="hover:text-orange-500" />
            </button>

            <button className="relative" aria-label="Shopping cart">
              <ShoppingCart size={22} className="hover:text-orange-500" />
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                0
              </span>
            </button>

          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="lg:hidden flex flex-col gap-4 py-5 border-t text-sm font-medium">
            <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>Categories</a>
            <a href="/products" onClick={() => setMenuOpen(false)}>Shop</a>
            <a href="#footer" onClick={() => setMenuOpen(false)}>Contact</a>
          </nav>
        )}

      </div>
    </header>
  );
}

export default Navbar;