import Link from "next/link";
import { clsx } from "clsx";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-btn px-4 py-2.5 text-center text-[17px] font-semibold leading-snug transition-opacity active:opacity-75 aria-disabled:pointer-events-none aria-disabled:opacity-45 disabled:pointer-events-none disabled:opacity-45";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-white",
  secondary: "border border-primary bg-card text-green",
  ghost: "text-green",
  danger: "border border-line bg-card text-danger",
};

export function Button({ variant = "primary", className, type = "button", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type={type} className={clsx(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={clsx(base, variants[variant], className)} {...props} />;
}

/** Square 44×44 icon button. Always needs an accessible label. */
export function IconButton({ label, className, type = "button", ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      className={clsx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-btn text-ink transition-opacity active:opacity-60 disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
