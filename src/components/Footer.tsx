import {
  Globe,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";

function Footer() {
  return (
    <footer id="footer" className="bg-[#111111] text-white pt-16 pb-8">

      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>

            <h2 className="text-3xl font-black">
              NOVA<span className="text-orange-500">.</span>
            </h2>

            <p className="text-gray-400 text-sm leading-7 mt-5 max-w-xs">
              Your destination for modern lifestyle, fashion,
              electronics, and everyday essentials.
            </p>

            <div className="flex gap-4 mt-6">
              <Globe size={19} className="text-gray-400 hover:text-orange-500 cursor-pointer" />
              <MessageCircle size={19} className="text-gray-400 hover:text-orange-500 cursor-pointer" />
              <Mail size={19} className="text-gray-400 hover:text-orange-500 cursor-pointer" />
            </div>

          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-lg mb-5">Quick Links</h3>

            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="#categories" className="hover:text-white">Categories</a></li>
              <li><a href="#products" className="hover:text-white">Shop</a></li>
              <li><a href="#footer" className="hover:text-white">About Us</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-lg mb-5">Customer Service</h3>

            <ul className="space-y-3 text-sm text-gray-400">
              <li>Contact Us</li>
              <li>Shipping Policy</li>
              <li>Returns & Refunds</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-5">Stay Updated</h3>

            <p className="text-sm text-gray-400 leading-6">
              Subscribe to receive updates about new products and offers.
            </p>

            <form
              className="flex mt-5 bg-white rounded-full p-1"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email"
                aria-label="Your email"
                className="min-w-0 flex-1 px-4 text-sm text-black outline-none rounded-full"
              />

              <button
                type="submit"
                aria-label="Subscribe"
                className="bg-orange-500 p-3 rounded-full hover:bg-orange-600"
              >
                <Send size={17} />
              </button>
            </form>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-14 pt-7 text-center text-sm text-gray-500">
          © 2026 NOVA Store. All rights reserved.
        </div>

      </div>
    </footer>
  );
}

export default Footer;