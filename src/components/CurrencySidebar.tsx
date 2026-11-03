import { useState, useEffect, useMemo, type ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import {
  X,
  Globe,
  Search,
  Check,
  TrendingUp,
  Calculator,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useCurrency, type Currency } from "../context/CurrencyContext";
import { useToast } from "../context/ToastContext";
import { DUR, EASE, SPRING } from "../lib/motion";
import { useFocusTrap } from "../lib/useFocusTrap";

export default function CurrencySidebar() {
  const {
    currentCurrency,
    currencies,
    isDrawerOpen,
    closeDrawer,
    setCurrency,
    formatPrice,
  } = useCurrency();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"checker" | "list">("checker");
  const [searchQuery, setSearchQuery] = useState("");
  const [testAmount, setTestAmount] = useState<number>(100);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Filtered currency list
  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currencies;
    return currencies.filter(
      (c) =>
        c.country.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currencies, searchQuery]);

  // Handler for selecting currency
  const handleSelectCurrency = (currency: Currency) => {
    setCurrency(currency);
    showToast(
      `Store currency set to ${currency.country} (${currency.code}) ${currency.flag}`,
      "success"
    );
  };

  const quickPresets = [25, 50, 100, 250, 500, 1000];

  return (
    <AnimatePresence>
      {isDrawerOpen && (
    <div key="currency" className="fixed inset-0 z-[100] flex justify-end" onKeyDown={(e) => e.key === "Escape" && closeDrawer()}>
      {/* Backdrop */}
      <m.div
        className="fixed inset-0 bg-night/55"
        onClick={closeDrawer}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: DUR.quick } }}
        exit={{ opacity: 0, transition: { duration: DUR.quick } }}
      />

      {/* Slide-out drawer: `sheet` motion, focus trapped while open */}
      <CurrencyPanel>
        {/* Drawer Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-950 via-neutral-900 to-gray-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
              <Globe size={22} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  Country & Currency Box
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-xs">
                  Live Rates
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Check & compare prices across international currencies
              </p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Active Currency Banner */}
        <div className="px-6 py-3.5 bg-orange-50 border-b border-orange-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl drop-shadow-sm">{currentCurrency.flag}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Active Currency:
                </span>
                <span className="text-xs font-black text-gray-950">
                  {currentCurrency.country} ({currentCurrency.code})
                </span>
              </div>
              <p className="text-[11px] text-orange-700 font-medium">
                1 USD = {currentCurrency.rate} {currentCurrency.code}
              </p>
            </div>
          </div>

          {currentCurrency.code !== "USD" && (
            <button
              onClick={() => handleSelectCurrency(currencies[0])}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-800 underline flex items-center gap-1"
            >
              <RefreshCw size={11} />
              Reset to USD
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex p-1 bg-gray-100 rounded-2xl">
            <button
              onClick={() => setActiveTab("checker")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "checker"
                  ? "bg-white text-gray-950 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Calculator size={15} className="text-orange-500" />
              Live Price Checker
            </button>

            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "list"
                  ? "bg-white text-gray-950 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Globe size={15} className="text-orange-500" />
              All Countries ({currencies.length})
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {activeTab === "checker" ? (
            /* TAB 1: LIVE PRICE CHECKER / CALCULATOR */
            <div className="space-y-5">
              {/* Price Input Box */}
              <div className="bg-gradient-to-br from-gray-900 to-neutral-900 text-white p-5 rounded-3xl shadow-xl border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Enter Any Base Price (USD)
                  </span>
                  <span className="text-[11px] text-gray-400">Compare instantly</span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-4 text-2xl font-black text-gray-400 pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={testAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTestAmount(isNaN(val) ? 0 : val);
                    }}
                    placeholder="100"
                    className="w-full bg-white/10 text-white text-2xl font-black pl-10 pr-4 py-3.5 rounded-2xl border border-white/15 outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition placeholder-gray-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
                  <span className="text-[11px] text-gray-400 self-center mr-1">Quick:</span>
                  {quickPresets.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTestAmount(amount)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                        testAmount === amount
                          ? "bg-orange-500 text-white shadow-xs"
                          : "bg-white/10 hover:bg-white/20 text-gray-200"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Converted Prices List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-orange-500" />
                    Price in Different Countries (${testAmount} USD)
                  </h3>
                  <span className="text-[11px] text-gray-400">Click to apply</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {currencies.map((currency) => {
                    const isSelected = currentCurrency.code === currency.code;
                    const convertedFormatted = formatPrice(testAmount, currency);

                    return (
                      <div
                        key={currency.code}
                        onClick={() => handleSelectCurrency(currency)}
                        className={`group cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? "bg-orange-500/10 border-orange-500/40 shadow-sm ring-1 ring-orange-500/30"
                            : "bg-white hover:bg-gray-50 border-gray-200/80 hover:border-orange-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                            {currency.flag}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                                {currency.country}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {currency.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Rate: 1 USD = {currency.rate} {currency.code}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-base font-black text-gray-950">
                              {convertedFormatted}
                            </div>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600">
                                <Check size={11} /> Current Store
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-gray-400 group-hover:text-orange-600 transition-colors">
                                Click to use
                              </span>
                            )}
                          </div>
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-600"
                            }`}
                          >
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: ALL COUNTRIES LIST WITH SEARCH */
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search country or currency (e.g. Pakistan, PKR)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 pl-10 pr-9 py-2.5 rounded-2xl text-xs font-medium outline-none border border-transparent focus:border-orange-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Countries List */}
              <div className="space-y-2">
                {filteredCurrencies.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm font-semibold">No countries found</p>
                    <p className="text-xs mt-1">Try another search term</p>
                  </div>
                ) : (
                  filteredCurrencies.map((currency) => {
                    const isSelected = currentCurrency.code === currency.code;
                    return (
                      <button
                        key={currency.code}
                        type="button"
                        onClick={() => handleSelectCurrency(currency)}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-orange-50 border-orange-300 ring-2 ring-orange-500/20 shadow-xs"
                            : "bg-white hover:bg-gray-50 border-gray-200/80 hover:border-orange-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{currency.flag}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900">
                                {currency.country}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {currency.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {currency.name} • Symbol: {currency.symbol}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-xs font-bold text-gray-700">
                              1 USD = {currency.rate} {currency.code}
                            </span>
                            {isSelected && (
                              <p className="text-[10px] font-extrabold text-orange-600">
                                SELECTED
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/80 shrink-0 flex items-center justify-between text-xs text-gray-500">
          <span>Prices update automatically across NOVA store</span>
          <button
            onClick={closeDrawer}
            className="px-4 py-2 bg-gray-950 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </CurrencyPanel>
    </div>
      )}
    </AnimatePresence>
  );
}

function CurrencyPanel({ children }: { children: ReactNode }) {
  const ref = useFocusTrap<HTMLElement>(true);
  return (
    <m.aside
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Currency and prices by country"
      tabIndex={-1}
      className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-overlay outline-none sm:max-w-lg sm:rounded-l-sheet sm:overflow-hidden"
      initial={{ x: "100%" }}
      animate={{ x: 0, transition: SPRING.sheet }}
      exit={{ x: "100%", transition: { duration: 0.26, ease: EASE.in } }}
    >
      {children}
    </m.aside>
  );
}
