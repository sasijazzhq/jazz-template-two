"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ChartNoAxesColumn, ChevronLeft, History, House } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./logo";

/** One-column app shell. Sticky header and footer respect the safe areas. */
export function Screen({ header, footer, children }: { header: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
      {header}
      <main id="main" className="safe-x flex flex-1 flex-col gap-5 pb-6 pt-2">
        {children}
      </main>
      {footer}
    </div>
  );
}

export function StepProgress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div
      role="progressbar"
      aria-label={`Step ${step} of ${total}`}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step}
      className="flex flex-col items-center gap-1.5 pb-1"
    >
      <p className="text-[14px] text-ink2">
        Step <span className="font-semibold text-ink">{step}</span> of {total}
      </p>
      <div aria-hidden className="flex w-40 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={clsx("h-1.5 flex-1 rounded-full", i < step ? "bg-primary" : "bg-line")} />
        ))}
      </div>
    </div>
  );
}

export function AppHeader({ back, backLabel = "Back", step, right }: { back?: string; backLabel?: string; step?: number; right?: ReactNode }) {
  return (
    <header className="safe-top safe-x sticky top-0 z-30 bg-bg/95 pb-2 backdrop-blur-sm">
      <div className="relative flex min-h-11 items-center justify-between">
        {back ? (
          <>
            <Link
              href={back}
              aria-label={backLabel}
              className="-ml-2 inline-flex size-11 items-center justify-center rounded-btn text-ink active:opacity-60"
            >
              <ChevronLeft aria-hidden size={26} />
            </Link>
            <span className="pointer-events-none absolute inset-x-0 flex justify-center">
              <Logo />
            </span>
            <span className="flex min-w-11 justify-end">{right}</span>
          </>
        ) : (
          <>
            <Logo />
            <span className="flex items-center">{right}</span>
          </>
        )}
      </div>
      {step ? <StepProgress step={step} /> : null}
    </header>
  );
}

const TABS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/savings", label: "Savings", Icon: ChartNoAxesColumn },
  { href: "/history", label: "History", Icon: History },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="safe-bottom sticky bottom-0 z-30 border-t border-line bg-card/95 pt-1.5 backdrop-blur-sm">
      <ul className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[12px]",
                  active ? "font-semibold text-green" : "text-ink2",
                )}
              >
                <Icon aria-hidden size={24} strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Sticky bottom action area. Sits in the layout flow, so it never covers content. */
export function StickyCTA({ hint, children }: { hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="safe-bottom safe-x sticky bottom-0 z-30 flex flex-col gap-2 border-t border-line bg-bg/95 pt-3 backdrop-blur-sm">
      {children}
      {hint ? <p className="text-center text-[14px] text-ink2">{hint}</p> : null}
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      {children ? <p className="text-[16px] text-ink2">{children}</p> : null}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[20px] font-semibold leading-tight">{children}</h2>
      {action}
    </div>
  );
}
