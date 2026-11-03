import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useScroll } from "motion/react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { Skeleton } from "../components/Skeleton";
import { SPARK_PATH } from "../components/Wordmark";
import { NovaGlow, NovaStars } from "../components/motion/NovaGlow";
import PhotoFan, { type FanPhoto } from "../components/motion/PhotoFan";
import { Stagger, StaggerItem } from "../components/motion/Stagger";
import type { Product } from "../data/products";
import { useCurrency } from "../context/CurrencyContext";
import { discountPercent, fetchCatalog, getImageUrl, STORE_CATEGORIES } from "../lib/catalog";

interface CategorySummary {
  name: string;
  count: number;
  minPrice: number;
  maxOff: number;
  photos: FanPhoto[];
}

/** Fan cards are small, so ask Unsplash for a 400px image instead of the 800px original. */
const fanImage = (url: string) => (url.includes("images.unsplash.com") ? url.replace(/([?&])w=\d+/, "$1w=400") : url);

const toPhoto = (p: Product): FanPhoto => ({ src: fanImage(getImageUrl(p.image, p.category)), alt: p.name, category: p.category });

/** Best-looking first: in stock, then highest rated, then biggest discount. */
const showcaseOrder = (a: Product, b: Product) =>
  Number(b.stock > 0) - Number(a.stock > 0) || b.rating - a.rating || discountPercent(b) - discountPercent(a);

function summarise(products: Product[]) {
  const names = [...STORE_CATEGORIES, ...new Set(products.map((p) => p.category))].filter((n, i, all) => all.indexOf(n) === i);
  const summaries: CategorySummary[] = [];
  const comingSoon: string[] = [];
  for (const name of names) {
    const items = products.filter((p) => p.category === name);
    if (items.length === 0) {
      comingSoon.push(name);
      continue;
    }
    summaries.push({
      name,
      count: items.length,
      minPrice: Math.min(...items.map((p) => p.price)),
      maxOff: Math.max(0, ...items.map(discountPercent)),
      photos: [...items].sort(showcaseOrder).slice(0, 3).map(toPhoto),
    });
  }
  return { summaries, comingSoon };
}

export default function CategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCatalog().then(({ products: list, offline: isOffline }) => {
      if (!active) return;
      setProducts(list);
      setOffline(isOffline);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const { summaries, comingSoon } = useMemo(() => summarise(products), [products]);

  const deals = useMemo(
    () => products.filter((p) => p.stock > 0 && discountPercent(p) > 0).sort((a, b) => discountPercent(b) - discountPercent(a)),
    [products]
  );

  const bestSellers = useMemo(
    () => [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0) || b.rating - a.rating).slice(0, 4),
    [products]
  );

  return (
    <div className="min-h-screen bg-porcelain">
      <Navbar />

      <header className="wrap pt-8 lg:pt-14">
        <h1 className="type-display-l">Shop by category</h1>
        <p className="mt-3 max-w-2xl text-muted">
          {loading ? "Counting what's in stock…" : `${products.length} products across ${summaries.length} categories. Pick one to see everything in it.`}
        </p>
        {offline && <p className="mt-2 text-sm text-warning">Showing the offline demo catalogue because the API isn't reachable.</p>}
      </header>

      <main className="wrap pb-16 pt-6 lg:pb-24 lg:pt-10">
        {loading ? (
          <CategoryIndexSkeleton />
        ) : (
          <Stagger className="border-t border-line">
            {summaries.map((summary) => (
              <StaggerItem key={summary.name}>
                <CategoryRow summary={summary} />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {!loading && comingSoon.length > 0 && (
          <p className="mt-6 text-sm text-muted">Coming soon: {new Intl.ListFormat("en", { type: "conjunction" }).format(comingSoon)}.</p>
        )}

        {!loading && deals.length > 0 && <DealsPanel deals={deals} categoryCount={new Set(deals.map((d) => d.category)).size} />}

        {!loading && bestSellers.length > 0 && (
          <section className="mt-16 lg:mt-24" aria-labelledby="best-sellers">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="best-sellers" className="type-h2">
                Best sellers
              </h2>
              <Link to="/products?sort=popular" className="whitespace-nowrap font-semibold underline-offset-4 hover:underline">
                See all ›
              </Link>
            </div>
            <Stagger className="grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-4 lg:gap-x-6">
              {bestSellers.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

/** One line of the index: the category name in display type, real numbers, and a fan of its own products. */
function CategoryRow({ summary }: { summary: CategorySummary }) {
  const { formatPrice } = useCurrency();
  const rowRef = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(false);
  // `settle`: the fan opens as the row scrolls up to the middle of the screen.
  const { scrollYProgress } = useScroll({ target: rowRef, offset: ["start end", "center center"] });

  return (
    <Link
      ref={rowRef}
      to={`/products?category=${encodeURIComponent(summary.name)}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      aria-label={`${summary.name}: ${summary.count} ${summary.count === 1 ? "product" : "products"}, from ${formatPrice(summary.minPrice)}`}
      className="group relative isolate grid grid-cols-[minmax(0,1fr)_128px] items-center gap-4 border-b border-line py-5 transition-transform duration-150 active:scale-[0.99] sm:grid-cols-[minmax(0,1fr)_240px] sm:py-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10 lg:py-8"
    >
      {/* Hover band */}
      <span
        aria-hidden="true"
        className={`absolute -inset-x-3 inset-y-1.5 -z-10 rounded-tile bg-surface transition-opacity duration-200 ease-nova-out lg:-inset-x-6 ${active ? "opacity-100" : "opacity-0"}`}
      />

      <div className="min-w-0">
        <h2 className="type-display-l flex items-start gap-2 text-[clamp(1.75rem,3.2vw+0.9rem,3.5rem)]">
          <span className={`transition-transform duration-300 ease-nova-out ${active ? "translate-x-1.5 lg:translate-x-3" : ""}`}>{summary.name}</span>
          <RowSpark visible={active} />
        </h2>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted lg:mt-4 lg:text-base">
          <span>
            {summary.count} {summary.count === 1 ? "product" : "products"}
          </span>
          <span>From {formatPrice(summary.minPrice)}</span>
          {summary.maxOff > 0 && <span className="tag tag-deal">Up to {summary.maxOff}% off</span>}
        </p>
      </div>

      <PhotoFan
        photos={summary.photos}
        spread={scrollYProgress}
        active={active}
        className="h-[132px] [--w:66px] sm:h-[190px] sm:[--w:108px] lg:mr-6 lg:h-[270px] lg:w-[460px] lg:justify-self-end lg:[--w:168px]"
      />
    </Link>
  );
}

/** The nova spark that pops in beside a row's name on hover or keyboard focus. */
function RowSpark({ visible }: { visible: boolean }) {
  const id = `row-spark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`mt-[0.08em] h-[0.42em] w-[0.42em] shrink-0 transition-[opacity,transform] duration-300 ease-nova-pop ${
        visible ? "translate-x-1.5 rotate-90 scale-100 opacity-100 lg:translate-x-3" : "scale-50 opacity-0"
      }`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF5CA8" />
          <stop offset=".55" stopColor="#FFB21E" />
          <stop offset="1" stopColor="#A58BFF" />
        </linearGradient>
      </defs>
      <path d={SPARK_PATH} fill={`url(#${id})`} />
    </svg>
  );
}

/** Night brand panel: the real deal count, with the glow behind a fan of the best deals. */
function DealsPanel({ deals, categoryCount }: { deals: Product[]; categoryCount: number }) {
  const panelRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const { scrollYProgress } = useScroll({ target: panelRef, offset: ["start end", "center center"] });
  const maxOff = discountPercent(deals[0]);

  return (
    <section
      ref={panelRef}
      aria-labelledby="deals-title"
      onPointerEnter={(e) => e.pointerType === "mouse" && setActive(true)}
      onPointerLeave={() => setActive(false)}
      className="on-night relative isolate mt-14 overflow-hidden rounded-sheet bg-night text-white lg:mt-20"
    >
      <NovaStars count={22} seed={7} />
      <NovaGlow className="absolute bottom-[-180px] left-1/2 aspect-square w-[520px] -translate-x-1/2 lg:bottom-auto lg:left-auto lg:right-[-60px] lg:top-1/2 lg:w-[640px] lg:-translate-y-1/2 lg:translate-x-0" />

      <div className="relative grid gap-8 px-6 pb-4 pt-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-6 lg:px-14 lg:py-14">
        <div className="relative z-10">
          <h2 id="deals-title" className="type-display-l">
            Up to {maxOff}% off right now
          </h2>
          <p className="mt-3 max-w-[40ch] text-on-night-muted">
            {deals.length} {deals.length === 1 ? "product is" : "products are"} on sale across {categoryCount}{" "}
            {categoryCount === 1 ? "category" : "categories"}.
          </p>
          <Link to="/products?sale=true" className="btn btn-buy mt-6">
            Shop deals
          </Link>
        </div>
        <PhotoFan
          photos={deals.slice(0, 4).map(toPhoto)}
          spread={scrollYProgress}
          active={active}
          onNight
          className="h-[230px] [--w:120px] sm:h-[280px] sm:[--w:150px] lg:h-[320px] lg:[--w:170px]"
        />
      </div>
    </section>
  );
}

function CategoryIndexSkeleton() {
  return (
    <div role="status" aria-label="Loading categories" className="border-t border-line">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_128px] items-center gap-4 border-b border-line py-5 sm:grid-cols-[minmax(0,1fr)_240px] sm:py-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10 lg:py-8">
          <div className="grid gap-3">
            <Skeleton className="h-9 w-3/4 lg:h-14" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="mx-auto h-[100px] w-[80px] rounded-[14px] sm:h-[135px] sm:w-[108px] lg:mr-[152px] lg:h-[210px] lg:w-[168px] lg:justify-self-end lg:rounded-[18px]" />
        </div>
      ))}
    </div>
  );
}
