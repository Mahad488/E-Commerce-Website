import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface PageShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: "narrow" | "wide";
}

/** Shared layout for content pages (About, FAQ, Contact, Track Order, legal). */
export default function PageShell({ eyebrow, title, subtitle, children, width = "narrow" }: PageShellProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <section className="bg-[#f5f2ed] py-14">
        <div className="max-w-5xl mx-auto px-5 lg:px-8">
          {eyebrow && <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest">{eyebrow}</p>}
          <h1 className="text-4xl md:text-5xl font-black mt-2">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-3 max-w-2xl">{subtitle}</p>}
        </div>
      </section>
      <main className={`flex-1 w-full mx-auto px-5 lg:px-8 py-12 ${width === "wide" ? "max-w-6xl" : "max-w-5xl"}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
