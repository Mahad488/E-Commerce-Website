import type { ReactNode } from "react";
import { Mail } from "lucide-react";

/** A quiet line telling the shopper which email is on its way, and where. */
export default function EmailNotice({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      role="status"
      className={`flex items-start gap-2.5 rounded-control border border-line bg-porcelain px-4 py-3 text-left text-sm text-ink ${className}`}
    >
      <Mail size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
