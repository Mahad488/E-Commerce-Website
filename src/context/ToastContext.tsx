import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "info" | "error";

export interface ToastMessage {
  id: string;
  title: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden flex items-center justify-between gap-3 p-4 rounded-2xl shadow-2xl text-white text-sm font-semibold transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in-50 ${
              toast.type === "success"
                ? "bg-gray-950/95 border border-white/10 backdrop-blur-md"
                : toast.type === "error"
                ? "bg-rose-950/95 border border-rose-500/30 backdrop-blur-md"
                : "bg-indigo-950/95 border border-indigo-500/30 backdrop-blur-md"
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" && (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={17} />
                </div>
              )}
              {toast.type === "info" && (
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Info size={17} />
                </div>
              )}
              {toast.type === "error" && (
                <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertCircle size={17} />
                </div>
              )}
              <span className="text-xs sm:text-sm font-medium text-gray-100">
                {toast.title}
              </span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              aria-label="Close notification"
            >
              <X size={15} />
            </button>

            {/* Subtle animated timer countdown bar */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                toast.type === "success"
                  ? "bg-gradient-to-r from-emerald-500 to-orange-500"
                  : toast.type === "error"
                  ? "bg-rose-500"
                  : "bg-indigo-500"
              }`}
              style={{
                animation: "toast-progress 3.6s linear forwards",
                transformOrigin: "left",
              }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
