"use client";

import { clsx } from "clsx";
import { Circle, CircleCheck, Clock, Sparkles } from "lucide-react";
import { Card, DemoBadge } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/sheet";
import type { Comparison, ComparisonOption } from "@/features/comparison-engine/engine";
import { formatINR, formatPercentTenths } from "@/features/comparison-engine/money";
import { formatTime } from "@/lib/hooks";
import type { PriceBreakdown } from "@/types/domain";
import { SourceStatus } from "./source-status";

export function RecommendationCard({ comparison }: { comparison: Comparison }) {
  const { recommended: r, baseline, savingPaise, savingPercentTenths, extraOverCheapestPaise, cheapest } = comparison;
  const estimated = r.status === "estimated";
  return (
    <Card className="flex flex-col gap-3 border-primary/30 bg-tint p-4">
      <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-green">
        <Sparkles aria-hidden size={16} />
        Best among compared options
        {r.demo ? <DemoBadge /> : null}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[20px] font-semibold leading-tight">{r.label}</p>
          <p className="text-[15px] text-ink2">
            {estimated ? "About " : ""}
            <span className="font-semibold tabular-nums text-ink">{formatINR(r.totalPaise)}</span> total
          </p>
        </div>
        {savingPaise > 0 && baseline ? (
          <div className="shrink-0 text-right">
            <p className="text-[14px] text-green">{estimated ? "Potential saving" : "You save"}</p>
            <p className="text-[34px] font-bold leading-none tabular-nums text-green">{formatINR(savingPaise)}</p>
          </div>
        ) : null}
      </div>
      <p className="text-[14px] leading-snug text-ink2">
        {savingPaise > 0 && baseline
          ? `${formatPercentTenths(savingPercentTenths)} less than ${baseline.label} (${formatINR(baseline.totalPaise)}).`
          : extraOverCheapestPaise > 0
            ? `${formatINR(extraOverCheapestPaise)} more than ${cheapest.label}.`
            : "No saving between the options you compared."}
        {estimated ? " The courier charge is an estimate, so the final saving may differ." : ""}
      </p>
    </Card>
  );
}

export function ComparisonRow({
  option,
  selected,
  recommended,
  onSelect,
  note,
}: {
  option: ComparisonOption;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
  note?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={clsx(
        "flex min-h-16 w-full items-center gap-3 rounded-card border p-3 text-left active:opacity-75",
        selected ? "border-primary bg-card ring-1 ring-primary" : "border-line bg-card",
      )}
    >
      {selected ? <CircleCheck aria-hidden size={24} className="shrink-0 text-green" /> : <Circle aria-hidden size={24} className="shrink-0 text-ink2" />}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[17px] font-semibold leading-snug">
          <span className="break-words">{option.label}</span>
          {recommended ? <span className="rounded-md bg-tint px-1.5 py-0.5 text-[13px] font-semibold text-green">Recommended</span> : null}
        </span>
        <span className="text-[14px] leading-snug text-ink2">{note ?? option.detail}</span>
        <span className="flex flex-wrap items-center gap-2">
          <SourceStatus status={option.status} />
          {option.etaMinutes !== undefined ? (
            <span className="inline-flex items-center gap-1 text-[13px] text-ink2">
              <Clock aria-hidden size={14} /> {option.etaMinutes} min
            </span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 text-right text-[20px] font-bold tabular-nums">
        <span className="sr-only">Total </span>
        {formatINR(option.totalPaise)}
      </span>
    </button>
  );
}

const BREAKDOWN_ROWS: [keyof PriceBreakdown, string, boolean][] = [
  ["itemSubtotalPaise", "Item subtotal", false],
  ["taxesPaise", "Taxes", false],
  ["packagingPaise", "Packaging", false],
  ["platformFeePaise", "Platform fee", false],
  ["deliveryFeePaise", "Delivery fee", false],
  ["discountPaise", "Discounts", true],
];

export function PriceBreakdownSheet({ options, open, onOpenChange }: { options: ComparisonOption[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Price breakdown" description="Totals are added up by Rusi from the amounts you entered or confirmed.">
      <div className="flex flex-col gap-4 pb-3">
        {options.map((option) => (
          <section key={option.id} aria-label={option.label} className="rounded-card border border-line p-3">
            <h3 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold">
              {option.label} {option.demo ? <DemoBadge /> : null}
            </h3>
            <dl className="mt-2 flex flex-col gap-2 text-[15px]">
              {option.parts.map((part) => (
                <div key={part.label} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="min-w-0 break-words">{part.label}</dt>
                    <dd className="shrink-0 font-semibold tabular-nums">{formatINR(part.amountPaise)}</dd>
                  </div>
                  {BREAKDOWN_ROWS.map(([key, label, negative]) => {
                    const value = part.quote.breakdown?.[key];
                    return value === undefined ? null : (
                      <div key={key} className="flex items-baseline justify-between gap-3 pl-3 text-[14px] text-ink2">
                        <dt>{label}</dt>
                        <dd className="tabular-nums">{formatINR(negative ? -value : value)}</dd>
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink2">
                    <SourceStatus status={part.status} />
                    <span>Added {formatTime(part.quote.capturedAt)}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2 text-[17px] font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(option.totalPaise)}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
    </Sheet>
  );
}
