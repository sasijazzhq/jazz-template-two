"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/sheet";

/**
 * Explicit opt-in for one AI phone call. Shown only when automated calling is
 * really available. Consenting to a call never authorises a purchase.
 */
export function CallConsentSheet({
  open,
  onOpenChange,
  restaurantName,
  onConsent,
  error,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName: string;
  onConsent: () => void;
  error: string | null;
  busy: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Let Rusi AI call?" description={`Rusi AI will phone ${restaurantName} once, on your behalf.`}>
      <div className="flex flex-col gap-3 pb-3 text-[15px] leading-relaxed">
        <ul className="list-disc pl-5">
          <li>It says at the start that it is an AI assistant.</li>
          <li>It asks about availability, the final price and preparation time.</li>
          <li>It does not place the order. You approve the price first.</li>
          <li>The call audio is processed by ElevenLabs to run the conversation.</li>
        </ul>
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-5 accent-[var(--primary)]" />
          <span>I agree to this one call. It does not authorise an order or a courier booking.</span>
        </label>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button disabled={!agreed || busy} onClick={onConsent}>{busy ? "Starting call…" : "Let Rusi AI call now"}</Button>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
      </div>
    </Sheet>
  );
}
