import { clsx } from "clsx";
import { CircleCheck, Circle, MapPin } from "lucide-react";
import { DemoBadge } from "@/components/ui/feedback";
import type { Branch } from "@/types/domain";

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m away` : `${(meters / 1000).toFixed(1)} km away`;
}

/** Single-select branch row. Address and distance appear only when a provider grounded them. */
export function BranchCard({ branch, selected, onSelect }: { branch: Branch; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={clsx(
        "flex min-h-16 w-full items-center gap-3 rounded-card border p-3 text-left active:opacity-75",
        selected ? "border-primary bg-tint ring-1 ring-primary" : "border-line bg-card",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[17px] font-semibold leading-snug">
          <span className="break-words">{branch.name}</span>
          {branch.source === "demo" ? <DemoBadge /> : null}
        </span>
        <span className="mt-0.5 flex items-start gap-1 text-[15px] text-ink2">
          <MapPin aria-hidden size={15} className="mt-0.5 shrink-0" />
          <span className="break-words">{branch.address ?? branch.area}</span>
        </span>
        <span className="block text-[14px] text-ink2">
          {branch.distanceMeters !== undefined
            ? formatDistance(branch.distanceMeters)
            : branch.source === "user_entered"
              ? "Entered by you"
              : "Distance not available"}
        </span>
      </span>
      {selected ? (
        <CircleCheck aria-hidden size={26} className="shrink-0 text-green" />
      ) : (
        <Circle aria-hidden size={26} className="shrink-0 text-ink2" />
      )}
    </button>
  );
}
