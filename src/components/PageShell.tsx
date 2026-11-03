import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface PageShellProps {
  /** Kept for existing callers; the design drops the label above titles (DESIGN.md §7, "Page title"). */
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: "narrow" | "wide";
}

/** Shared layout for content pages (About, FAQ, Contact, Track order, legal). */
export default function PageShell({ title, subtitle, children, width = "narrow" }: PageShellProps) {
  const max = width === "wide" ? "max-w-6xl" : "max-w-5xl";
  return (
    <div className="flex min-h-screen flex-col bg-porcelain">
      <Navbar />
      <header className={`wrap ${max} pb-2 pt-8 lg:pt-12`}>
        <h1 className="type-display-l">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-muted">{subtitle}</p>}
      </header>
      <main className={`wrap ${max} flex-1 py-8 lg:py-12`}>{children}</main>
      <Footer />
    </div>
  );
}
