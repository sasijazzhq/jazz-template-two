import { clsx } from "clsx";
import { BadgeCheck, CircleSlash, Clock, PencilLine, ScanSearch, Sigma } from "lucide-react";
import type { SourceStatus as Status } from "@/types/domain";

const META: Record<Status, { label: string; Icon: typeof BadgeCheck; tone: "good" | "neutral" | "warn" }> = {
  verified_checkout: { label: "Verified checkout", Icon: BadgeCheck, tone: "good" },
  user_entered: { label: "User-entered", Icon: PencilLine, tone: "neutral" },
  ai_extracted_review: { label: "AI extracted — review", Icon: ScanSearch, tone: "warn" },
  estimated: { label: "Estimated", Icon: Sigma, tone: "warn" },
  expired: { label: "Expired", Icon: Clock, tone: "warn" },
  unavailable: { label: "Unavailable", Icon: CircleSlash, tone: "neutral" },
};

/** Where a price came from and how far to trust it. Icon + text, never colour alone. */
export function SourceStatus({ status }: { status: Status }) {
  const { label, Icon, tone } = META[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] font-medium",
        tone === "good" && "bg-tint text-green",
        tone === "neutral" && "bg-fill text-ink2",
        tone === "warn" && "bg-warn-tint text-warn",
      )}
    >
      <Icon aria-hidden size={14} />
      {label}
    </span>
  );
}
