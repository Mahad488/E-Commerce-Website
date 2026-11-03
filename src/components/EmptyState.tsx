import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  body?: ReactNode;
  action?: { to: string; label: string };
  /** Optional row of real products ("Just added") under the message. */
  children?: ReactNode;
  className?: string;
}

/** One sentence, one line of help, one button (DESIGN.md §7). No illustrations. */
export default function EmptyState({ title, body, action, children, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center text-center gap-3 py-12 ${className}`}>
      <h2 className="type-h2">{title}</h2>
      {body && <p className="text-muted max-w-[44ch]">{body}</p>}
      {action && (
        <Link to={action.to} className="btn btn-primary mt-2">
          {action.label}
        </Link>
      )}
      {children && <div className="w-full mt-8">{children}</div>}
    </div>
  );
}
