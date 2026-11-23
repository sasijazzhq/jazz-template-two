import { clsx } from "clsx";
import { AlertCircle, Info, Loader2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("rounded-card border border-line bg-card", className)}>{children}</div>;
}

export function Spinner({ label }: { label: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-[15px] text-ink2">
      <Loader2 aria-hidden size={18} className="spinner" />
      {label}
    </span>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-start gap-2 p-4">
      {icon ? <span className="text-ink2">{icon}</span> : null}
      <p className="text-[17px] font-semibold">{title}</p>
      <div className="flex w-full flex-col gap-3 text-[15px] text-ink2">{children}</div>
    </Card>
  );
}

export function ErrorState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-card border border-danger/40 bg-danger-tint p-4">
      <AlertCircle aria-hidden size={20} className="mt-0.5 shrink-0 text-danger" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="text-[16px] font-semibold text-danger">{title}</p>
        <div className="flex flex-col gap-3 text-[15px] text-ink">{children}</div>
      </div>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  return (
    <div
      className={clsx(
        "flex gap-2.5 rounded-btn p-3 text-[14px] leading-snug",
        tone === "warn" ? "bg-warn-tint text-warn" : "bg-fill text-ink2",
      )}
    >
      <Icon aria-hidden size={18} className="mt-px shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Marks illustrative sample data. Text, not colour alone. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-md border border-warn/40 bg-warn-tint px-1.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-warn", className)}>
      Demo
    </span>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-[14px] text-danger">
      <AlertCircle aria-hidden size={16} className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}
