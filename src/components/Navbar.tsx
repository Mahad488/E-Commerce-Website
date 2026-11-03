import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";

import { FREE_SHIPPING_THRESHOLD, useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCurrency } from "../context/CurrencyContext";
import type { Product } from "../data/products";
import { getImageUrl, imageFallbackHandler } from "../lib/catalog";
import { DUR, EASE, SPRING } from "../lib/motion";
import { useFocusTrap } from "../lib/useFocusTrap";
import { useProductSearch } from "../lib/useProductSearch";
import AnimatedNumber from "./motion/AnimatedNumber";
import { useFlyTarget } from "./motion/flyToCartContext";
import { usePopOnChange } from "./motion/usePopOnChange";
import Wordmark from "./Wordmark";

const LINKS = [
  { to: "/products", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/products?sale=true", label: "Deals" },
  { to: "/faq", label: "Help" },
];

const MENU_LINKS = [
  { to: "/products", label: "Shop all" },
  { to: "/categories", label: "Categories" },
  { to: "/products?sale=true", label: "Deals" },
  { to: "/track-order", label: "Track an order" },
  { to: "/faq", label: "Delivery, returns and FAQ" },
  { to: "/contact", label: "Contact us" },
  { to: "/about", label: "About NOVA" },
];

interface NavbarProps {
  /** "night" sits on a night hero (white icons) until the hero scrolls under it. */
  tone?: "light" | "night";
}

export default function Navbar({ tone = "light" }: NavbarProps) {
  const { cartCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { currentCurrency, openDrawer, formatPrice } = useCurrency();
  const flyTarget = useFlyTarget();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lit, setLit] = useState(false);

  // Light pages: a surface layer + hairline fades in after 8px. Night pages: once the hero has scrolled under the bar.
  useEffect(() => {
    const onScroll = () => {
      if (tone === "night") {
        const hero = document.querySelector("[data-night-hero]");
        setLit(hero ? hero.getBoundingClientRect().bottom <= 64 : window.scrollY > 8);
      } else {
        setLit(window.scrollY > 8);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [tone]);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  const onNight = tone === "night" && !lit;

  return (
    <>
      <div className="bg-night-2 py-[7px] text-center text-[0.8125rem] text-on-night-muted">
        <div className="wrap">
          Free delivery over <b className="font-[620] text-white">{formatPrice(FREE_SHIPPING_THRESHOLD)}</b>. Cash on delivery.
        </div>
      </div>

      <header className={`sticky top-0 z-50 isolate ${onNight ? "on-night text-white" : "text-ink"}`}>
        <div aria-hidden="true" className={`absolute inset-0 -z-20 ${tone === "night" ? "bg-night" : "bg-porcelain"}`} />
        <div
          aria-hidden="true"
          className={`absolute inset-0 -z-10 border-b border-line bg-surface transition-opacity duration-150 ease-nova-out ${lit ? "opacity-100" : "opacity-0"}`}
        />
        <div className="wrap flex h-14 items-center gap-1 lg:h-16">
          <button type="button" className="icon-btn -ml-2.5 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <Link to="/" aria-label="NOVA home" className="mr-auto text-[1.375rem] lg:mr-12">
            <Wordmark primary />
          </Link>

          <nav aria-label="Main" className="mr-auto hidden items-center gap-7 text-[0.9375rem] font-[560] lg:flex">
            {LINKS.map((link) => (
              <Link key={link.label} to={link.to} className="opacity-90 underline-offset-[6px] hover:underline hover:opacity-100">
                {link.label}
              </Link>
            ))}
          </nav>

          <DesktopSearch />

          <button type="button" className="icon-btn md:hidden" onClick={() => setSearchOpen(true)} aria-label="Search products">
            <Search size={21} />
          </button>

          <button
            type="button"
            onClick={openDrawer}
            className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-ink/5 sm:inline-flex [.on-night_&]:hover:bg-white/10"
            aria-label={`Currency: ${currentCurrency.code}. Change currency`}
          >
            <span aria-hidden="true">{currentCurrency.flag}</span>
            {currentCurrency.code}
            <ChevronDown size={15} aria-hidden="true" />
          </button>

          <Link to={isAuthenticated ? "/account" : "/login"} className="icon-btn hidden sm:inline-grid" aria-label={isAuthenticated ? "Your account" : "Sign in"}>
            <User size={21} />
          </Link>

          <Link to="/wishlist" className="icon-btn" aria-label={`Wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}`}>
            <Heart size={21} />
            <CountBadge count={wishlistCount} />
          </Link>

          <button
            ref={flyTarget}
            type="button"
            onClick={openCart}
            className="icon-btn -mr-2.5"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          >
            <ShoppingBag size={21} />
            <CountBadge count={cartCount} />
          </button>
        </div>
      </header>

      <AnimatePresence>{menuOpen && <MenuSheet onClose={() => setMenuOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{searchOpen && <SearchSheet onClose={() => setSearchOpen(false)} />}</AnimatePresence>
    </>
  );
}

function CountBadge({ count }: { count: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  usePopOnChange(ref, count);
  return (
    <AnimatePresence>
      {count > 0 && (
        <m.span
          ref={ref}
          aria-hidden="true"
          className="count-badge overflow-hidden"
          initial={{ scale: 0 }}
          animate={{ scale: 1, transition: SPRING.pop }}
          exit={{ scale: 0, transition: { duration: DUR.quick } }}
        >
          <AnimatedNumber value={count} />
        </m.span>
      )}
    </AnimatePresence>
  );
}

function useSearchSubmit(onDone?: () => void) {
  const navigate = useNavigate();
  return {
    goToResults: (term: string) => {
      onDone?.();
      navigate(term.trim() ? `/products?search=${encodeURIComponent(term.trim())}` : "/products");
    },
    goToProduct: (id: number) => {
      onDone?.();
      navigate(`/products/${id}`);
    },
  };
}

function SearchResults({ results, query, onPick, onAll }: { results: Product[]; query: string; onPick: (id: number) => void; onAll: () => void }) {
  const { formatPrice } = useCurrency();
  if (results.length === 0) {
    return <p className="p-4 text-sm text-muted">No products match “{query.trim()}”. Try a shorter word.</p>;
  }
  return (
    <div className="py-1.5">
      {results.map((item) => (
        <button key={item.id} type="button" onClick={() => onPick(item.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-porcelain">
          <span className="well block h-12 w-10 shrink-0 rounded-[8px]">
            <img
              src={getImageUrl(item.image, item.category)}
              onError={imageFallbackHandler(item.category)}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{item.name}</span>
            <span className="type-price block text-sm text-muted">{formatPrice(Number(item.price))}</span>
          </span>
        </button>
      ))}
      <button type="button" onClick={onAll} className="w-full px-3 py-2.5 text-left text-sm font-semibold underline underline-offset-4 hover:text-flare">
        See all results for “{query.trim()}”
      </button>
    </div>
  );
}

function DesktopSearch() {
  const { query, setQuery, results, searched } = useProductSearch();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { goToResults, goToProduct } = useSearchSubmit(() => {
    setOpen(false);
    setQuery("");
  });

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    goToResults(query);
  };

  return (
    <div ref={boxRef} className="relative mr-2 hidden w-60 md:block xl:w-72">
      <form role="search" onSubmit={submit} className="relative">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search products"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="input h-10 rounded-full pl-10 text-[0.9375rem]"
        />
      </form>
      <AnimatePresence>
        {open && searched && query.trim() && (
          <m.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: DUR.quick, ease: EASE.out }}
            className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-tile border border-line bg-surface text-ink shadow-overlay"
          >
            <SearchResults results={results} query={query} onPick={goToProduct} onAll={() => goToResults(query)} />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchSheet({ onClose }: { onClose: () => void }) {
  const { query, setQuery, results, searched } = useProductSearch();
  const { goToResults, goToProduct } = useSearchSubmit(onClose);
  const ref = useFocusTrap<HTMLDivElement>(true);

  return (
    <m.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="fixed inset-0 z-[85] flex flex-col bg-surface pt-[env(safe-area-inset-top,0px)] text-ink"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0, transition: SPRING.sheet }}
      exit={{ opacity: 0, y: -8, transition: { duration: DUR.quick, ease: EASE.in } }}
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToResults(query);
        }}
        className="wrap flex items-center gap-2 border-b border-line py-2"
      >
        <Search size={19} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          data-autofocus
          type="search"
          aria-label="Search products"
          placeholder="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none"
        />
        <button type="button" onClick={onClose} className="icon-btn -mr-2.5" aria-label="Close search">
          <X size={22} />
        </button>
      </form>
      <div className="wrap flex-1 overflow-y-auto">
        {searched && query.trim() ? (
          <SearchResults results={results} query={query} onPick={goToProduct} onAll={() => goToResults(query)} />
        ) : (
          <p className="py-6 text-sm text-muted">Search by product name, category or colour.</p>
        )}
      </div>
    </m.div>
  );
}

function MenuSheet({ onClose }: { onClose: () => void }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { currentCurrency, openDrawer } = useCurrency();
  const navigate = useNavigate();
  const ref = useFocusTrap<HTMLDivElement>(true);

  return (
    <div className="fixed inset-0 z-[85]" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <m.div
        className="absolute inset-0 bg-night/50"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: DUR.quick } }}
        exit={{ opacity: 0, transition: { duration: DUR.quick } }}
      />
      <m.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col overflow-y-auto rounded-r-sheet bg-surface pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top,0px)] text-ink shadow-overlay"
        initial={{ x: "-100%" }}
        animate={{ x: 0, transition: SPRING.sheet }}
        exit={{ x: "-100%", transition: { duration: 0.24, ease: EASE.in } }}
      >
        <div className="flex h-14 items-center justify-between pl-5 pr-2">
          <Wordmark className="text-[1.375rem]" />
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close menu" data-autofocus>
            <X size={22} />
          </button>
        </div>

        <nav aria-label="Menu" className="grid px-3 pt-2">
          {MENU_LINKS.map((link) => (
            <Link key={link.label} to={link.to} onClick={onClose} className="rounded-control px-3 py-3 text-[1.0625rem] font-semibold hover:bg-porcelain">
              {link.label}
            </Link>
          ))}
          <Link to="/wishlist" onClick={onClose} className="flex items-center justify-between rounded-control px-3 py-3 text-[1.0625rem] font-semibold hover:bg-porcelain">
            Wishlist <span className="text-sm font-medium text-muted">{wishlistCount}</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              openCart();
            }}
            className="flex items-center justify-between rounded-control px-3 py-3 text-left text-[1.0625rem] font-semibold hover:bg-porcelain"
          >
            Cart <span className="text-sm font-medium text-muted">{cartCount}</span>
          </button>
        </nav>

        <div className="mx-5 my-4 border-t border-line" />

        <button
          type="button"
          onClick={() => {
            onClose();
            openDrawer();
          }}
          className="mx-3 flex items-center justify-between rounded-control px-3 py-3 text-left hover:bg-porcelain"
        >
          <span className="font-semibold">Currency</span>
          <span className="text-muted">
            <span aria-hidden="true">{currentCurrency.flag}</span> {currentCurrency.code}
          </span>
        </button>

        <div className="mt-auto grid gap-2 px-5 pt-6">
          {isAuthenticated ? (
            <>
              <Link to="/account" onClick={onClose} className="btn btn-primary">
                {user?.name ? `${user.name.split(" ")[0]}'s account` : "Your account"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                  navigate("/");
                }}
                className="btn btn-secondary"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={onClose} className="btn btn-primary">
                Sign in
              </Link>
              <Link to="/register" onClick={onClose} className="btn btn-secondary">
                Create an account
              </Link>
            </>
          )}
        </div>
      </m.div>
    </div>
  );
}
