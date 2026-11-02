/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface Currency {
  code: string;
  name: string;
  country: string;
  symbol: string;
  flag: string;
  rate: number; // Rate relative to 1 USD
  symbolPosition: "before" | "after";
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  {
    code: "USD",
    name: "US Dollar",
    country: "United States",
    symbol: "$",
    flag: "🇺🇸",
    rate: 1.0,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "PKR",
    name: "Pakistani Rupee",
    country: "Pakistan",
    symbol: "Rs.",
    flag: "🇵🇰",
    rate: 278.5,
    symbolPosition: "before",
    decimals: 0,
  },
  {
    code: "INR",
    name: "Indian Rupee",
    country: "India",
    symbol: "₹",
    flag: "🇮🇳",
    rate: 86.8,
    symbolPosition: "before",
    decimals: 0,
  },
  {
    code: "AED",
    name: "UAE Dirham",
    country: "United Arab Emirates",
    symbol: "AED",
    flag: "🇦🇪",
    rate: 3.67,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "SAR",
    name: "Saudi Riyal",
    country: "Saudi Arabia",
    symbol: "SAR",
    flag: "🇸🇦",
    rate: 3.75,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "GBP",
    name: "British Pound",
    country: "United Kingdom",
    symbol: "£",
    flag: "🇬🇧",
    rate: 0.79,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "EUR",
    name: "Euro",
    country: "European Union",
    symbol: "€",
    flag: "🇪🇺",
    rate: 0.92,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    country: "Canada",
    symbol: "CA$",
    flag: "🇨🇦",
    rate: 1.38,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "AUD",
    name: "Australian Dollar",
    country: "Australia",
    symbol: "AU$",
    flag: "🇦🇺",
    rate: 1.54,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "QAR",
    name: "Qatari Riyal",
    country: "Qatar",
    symbol: "QAR",
    flag: "🇶🇦",
    rate: 3.64,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "KWD",
    name: "Kuwaiti Dinar",
    country: "Kuwait",
    symbol: "KWD",
    flag: "🇰🇼",
    rate: 0.31,
    symbolPosition: "before",
    decimals: 3,
  },
  {
    code: "OMR",
    name: "Omani Rial",
    country: "Oman",
    symbol: "OMR",
    flag: "🇴🇲",
    rate: 0.38,
    symbolPosition: "before",
    decimals: 3,
  },
  {
    code: "TRY",
    name: "Turkish Lira",
    country: "Turkey",
    symbol: "₺",
    flag: "🇹🇷",
    rate: 34.2,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    country: "Japan",
    symbol: "¥",
    flag: "🇯🇵",
    rate: 152.0,
    symbolPosition: "before",
    decimals: 0,
  },
  {
    code: "CNY",
    name: "Chinese Yuan",
    country: "China",
    symbol: "¥",
    flag: "🇨🇳",
    rate: 7.24,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "MYR",
    name: "Malaysian Ringgit",
    country: "Malaysia",
    symbol: "RM",
    flag: "🇲🇾",
    rate: 4.45,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "BDT",
    name: "Bangladeshi Taka",
    country: "Bangladesh",
    symbol: "৳",
    flag: "🇧🇩",
    rate: 119.5,
    symbolPosition: "before",
    decimals: 0,
  },
  {
    code: "ZAR",
    name: "South African Rand",
    country: "South Africa",
    symbol: "R",
    flag: "🇿🇦",
    rate: 18.2,
    symbolPosition: "before",
    decimals: 2,
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    country: "Singapore",
    symbol: "S$",
    flag: "🇸🇬",
    rate: 1.34,
    symbolPosition: "before",
    decimals: 2,
  },
];

const STORAGE_KEY = "nova_selected_currency";

interface CurrencyContextType {
  currentCurrency: Currency;
  currencies: Currency[];
  isDrawerOpen: boolean;
  setCurrency: (currency: Currency) => void;
  setCurrencyByCode: (code: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  convertPrice: (priceInUSD: number, targetCurrency?: Currency) => number;
  formatPrice: (priceInUSD: number, targetCurrency?: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currentCurrency, setCurrentCurrencyState] = useState<Currency>(() => {
    try {
      const savedCode = localStorage.getItem(STORAGE_KEY);
      if (savedCode) {
        const found = CURRENCIES.find((c) => c.code === savedCode);
        if (found) return found;
      }
    } catch {
      // Ignore local storage error
    }
    return CURRENCIES[0]; // Default USD
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const setCurrency = useCallback((currency: Currency) => {
    setCurrentCurrencyState(currency);
    try {
      localStorage.setItem(STORAGE_KEY, currency.code);
    } catch {
      // Ignore
    }
  }, []);

  const setCurrencyByCode = useCallback((code: string) => {
    const found = CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (found) {
      setCurrency(found);
    }
  }, [setCurrency]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const convertPrice = useCallback(
    (priceInUSD: number, targetCurrency: Currency = currentCurrency): number => {
      const num = Number(priceInUSD) || 0;
      return num * targetCurrency.rate;
    },
    [currentCurrency]
  );

  const formatPrice = useCallback(
    (priceInUSD: number, targetCurrency: Currency = currentCurrency): string => {
      const num = Number(priceInUSD) || 0;
      const converted = num * targetCurrency.rate;
      const decimals = targetCurrency.decimals;

      const formattedNumber = converted.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

      if (targetCurrency.symbolPosition === "after") {
        return `${formattedNumber} ${targetCurrency.symbol}`;
      }

      // Add space for text-based symbols like Rs., AED, SAR, RM, etc.
      const needsSpace = targetCurrency.symbol.length > 1;
      return `${targetCurrency.symbol}${needsSpace ? " " : ""}${formattedNumber}`;
    },
    [currentCurrency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        currencies: CURRENCIES,
        isDrawerOpen,
        setCurrency,
        setCurrencyByCode,
        openDrawer,
        closeDrawer,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
