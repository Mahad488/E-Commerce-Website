import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { m } from "motion/react";
import { X } from "lucide-react";
import { useFocusTrap } from "../../src/lib/useFocusTrap";
import { DUR, EASE, SPRING } from "../../src/lib/motion";

interface AdminModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class for the panel. */
  width?: string;
}

/**
 * Dialog shell for the admin portal: centred on desktop, a bottom sheet on phones.
 * Focus is trapped, Escape and the backdrop close it. Render it inside
 * <AnimatePresence> so it can animate out.
 */
export default function AdminModal({ title, description, onClose, children, width = "sm:max-w-lg" }: AdminModalProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <m.div
        className="absolute inset-0 bg-night/55"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: DUR.quick } }}
        exit={{ opacity: 0, transition: { duration: DUR.quick } }}
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-sheet bg-surface p-5 text-ink shadow-overlay outline-none sm:rounded-sheet sm:p-6 ${width}`}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0, transition: SPRING.sheet }}
        exit={{ opacity: 0, y: 24, transition: { duration: DUR.quick, ease: EASE.in } }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-porcelain hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flare"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        {children}
      </m.div>
    </div>,
    document.body
  );
}
