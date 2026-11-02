import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-5 py-24 relative overflow-hidden">
        <div className="absolute w-[520px] h-[520px] rounded-full bg-orange-200/40 blur-3xl -z-0" />
        <div className="text-center relative">
          <p className="text-[120px] sm:text-[180px] font-black leading-none bg-gradient-to-br from-orange-500 via-amber-400 to-rose-500 bg-clip-text text-transparent animate-float-slow select-none">
            404
          </p>
          <h1 className="text-3xl font-black mt-2">This page wandered off</h1>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">
            The link might be broken or the page may have moved. Let's get you back to something good.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link to="/" className="inline-flex items-center gap-2 bg-black text-white rounded-full px-7 py-3.5 text-sm font-bold hover:bg-orange-500 transition">
              <ArrowLeft size={16} /> Back home
            </Link>
            <Link to="/products" className="inline-flex items-center gap-2 border border-gray-300 rounded-full px-7 py-3.5 text-sm font-bold hover:bg-gray-50 transition">
              <Search size={16} /> Browse products
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
