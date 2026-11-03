import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { AnimatePresence, m } from "motion/react";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

import { EASE, SPRING } from "../lib/motion";

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

const ICONS = {
  success: { Icon: CheckCircle2, className: "text-success-on-night" },
  info: { Icon: Info, className: "text-info-on-night" },
  error: { Icon: AlertCircle, className: "text-error-on-night" },
} as const;

const DISMISS_AFTER_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      // Keep at most three on screen; the oldest goes first.
      setToasts((prev) => [...prev.slice(-2), { id, title, type }]);
      setTimeout(() => removeToast(id), DISMISS_AFTER_MS);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Bottom-centre on phones (thumb zone), top-right under the navbar on desktop. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-[130] flex flex-col items-center gap-2 px-4 lg:bottom-auto lg:top-[84px] lg:items-end lg:px-10"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { Icon, className } = ICONS[toast.type];
            return (
              <m.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING.sheet }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.16, ease: EASE.in } }}
                drag="x"
                dragSnapToOrigin
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) removeToast(toast.id);
                }}
                className="pointer-events-auto flex w-full max-w-[420px] cursor-grab items-center gap-3 rounded-control bg-ink py-3 pl-4 pr-2 text-[0.9375rem] text-white shadow-overlay active:cursor-grabbing"
              >
                <Icon size={20} className={`shrink-0 ${className}`} aria-hidden="true" />
                <span className="flex-1">{toast.title}</span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="icon-btn h-9 w-9 text-on-night-muted hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
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
