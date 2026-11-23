"use client";

import { useId, useState } from "react";
import { FieldError } from "@/components/ui/feedback";
import { paiseToInput, parseRupeesToPaise } from "@/features/comparison-engine/money";

/** Rupee amount field. Reports integer paise, or null while empty/invalid. */
export function PriceInput({
  label,
  valuePaise,
  onChange,
  hideLabel,
}: {
  label: string;
  valuePaise: number | undefined;
  onChange: (paise: number | null) => void;
  hideLabel?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (valuePaise !== undefined ? paiseToInput(valuePaise) : "");
  const invalid = shown.trim() !== "" && (parseRupeesToPaise(shown) ?? 0) <= 0;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-[14px] font-medium text-ink2"}>{label}</label>
      <div className="flex min-h-12 items-center rounded-btn border border-line bg-card px-3 focus-within:border-primary">
        <span aria-hidden className="pr-1.5 text-[17px] text-ink2">₹</span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={shown}
          placeholder="0"
          maxLength={10}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            const paise = parseRupeesToPaise(next);
            onChange(paise !== null && paise > 0 ? paise : null);
          }}
          className="w-full min-w-0 bg-transparent py-2 text-[17px] font-semibold tabular-nums outline-none"
        />
      </div>
      {invalid ? <FieldError id={`${id}-error`}>Enter an amount in rupees, like 280 or 280.50.</FieldError> : null}
    </div>
  );
}

export function MinutesInput({ label, value, onChange }: { label: string; value: number | undefined; onChange: (minutes: number | undefined) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-medium text-ink2">{label}</label>
      <div className="flex min-h-12 items-center rounded-btn border border-line bg-card px-3 focus-within:border-primary">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          defaultValue={value ?? ""}
          maxLength={3}
          placeholder="Optional"
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            onChange(/^\d{1,3}$/.test(e.target.value.trim()) && n > 0 ? n : undefined);
          }}
          className="w-full min-w-0 bg-transparent py-2 text-[17px] tabular-nums outline-none placeholder:text-[15px] placeholder:text-ink2"
        />
        <span aria-hidden className="pl-1.5 text-[15px] text-ink2">min</span>
      </div>
    </div>
  );
}
