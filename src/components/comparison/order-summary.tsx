import { MapPin, Utensils } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/feedback";
import type { Session } from "@/lib/store";

/** Compact summary of what is being compared. No stock food imagery. */
export function OrderSummary({ session, action }: { session: Session; action?: ReactNode }) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-btn bg-tint text-green">
        <Utensils size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[17px] font-semibold leading-snug">
          {session.itemName} <span className="whitespace-nowrap">× {session.quantity}</span>
        </p>
        <p className="break-words text-[15px] text-ink2">{session.restaurantName || "Restaurant not chosen"}</p>
        {session.branch ? (
          <p className="flex items-start gap-1 text-[14px] text-ink2">
            <MapPin aria-hidden size={14} className="mt-0.5 shrink-0" />
            <span className="break-words">{session.branch.area}</span>
          </p>
        ) : null}
      </div>
      {action}
    </Card>
  );
}
