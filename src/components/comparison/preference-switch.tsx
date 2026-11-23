"use client";

import { clsx } from "clsx";
import { motion, useReducedMotion } from "motion/react";
import type { Preference } from "@/types/domain";

const OPTIONS: { id: Preference; label: string }[] = [
  { id: "cheapest", label: "Cheapest" },
  { id: "fastest", label: "Fastest" },
  { id: "balance", label: "Best balance" },
];

/** Segmented control. Selection is shown by weight and a raised thumb, not colour alone. */
export function PreferenceSwitch({ value, onChange }: { value: Preference; onChange: (value: Preference) => void }) {
  const reduce = useReducedMotion();
  return (
    <div role="radiogroup" aria-label="What matters most" className="grid grid-cols-3 gap-1 rounded-btn bg-fill p-1">
      {OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={clsx("relative min-h-11 rounded-[9px] px-1 text-[15px] leading-tight", selected ? "font-semibold text-ink" : "text-ink2")}
          >
            {selected ? (
              <motion.span
                layoutId="preference-thumb"
                transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0.15 }}
                className="absolute inset-0 rounded-[9px] border border-line bg-card shadow-sm"
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
