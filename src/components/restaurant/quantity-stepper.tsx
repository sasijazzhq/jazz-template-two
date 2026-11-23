import { Minus, Plus } from "lucide-react";

export function QuantityStepper({ value, onChange, min = 1, max = 20 }: { value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const button = "inline-flex size-11 items-center justify-center rounded-btn border border-line bg-card text-ink active:opacity-60 disabled:opacity-35";
  return (
    <div role="group" aria-label="Quantity" className="flex items-center gap-2">
      <button type="button" aria-label="Decrease quantity" className={button} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus aria-hidden size={20} />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-[20px] font-semibold tabular-nums">{value}</output>
      <button type="button" aria-label="Increase quantity" className={button} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus aria-hidden size={20} />
      </button>
    </div>
  );
}
