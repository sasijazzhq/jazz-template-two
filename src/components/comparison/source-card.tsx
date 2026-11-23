"use client";

import { Bike, Check, ImageUp, RefreshCw, Store, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Card, DemoBadge, FieldError, Notice, Spinner } from "@/components/ui/feedback";
import { MAX_SCREENSHOT_BYTES, SCREENSHOT_TYPES, type Extraction } from "@/features/price-extraction/schema";
import { useCapabilities } from "@/lib/hooks";
import type { PriceQuote, SourceId } from "@/types/domain";
import { MinutesInput, PriceInput } from "./price-input";
import { SourceStatus } from "./source-status";

const META: Record<SourceId, { name: string; help: string; amountLabel: string; etaLabel: string; mark: ReactNode; markClass: string }> = {
  swiggy: { name: "Swiggy", help: "Final amount on the Swiggy checkout screen", amountLabel: "Swiggy final payable amount", etaLabel: "Delivery time shown", mark: "S", markClass: "bg-[#fff1e6] text-[#9a3f00]" },
  zomato: { name: "Zomato", help: "Final amount on the Zomato checkout screen", amountLabel: "Zomato final payable amount", etaLabel: "Delivery time shown", mark: "Z", markClass: "bg-[#fde8ea] text-[#a3182b]" },
  takeaway: { name: "Direct takeaway", help: "Price the restaurant quotes for takeaway", amountLabel: "Restaurant takeaway price", etaLabel: "Ready in", mark: <Store aria-hidden size={22} />, markClass: "bg-tint text-green" },
  courier: { name: "Courier estimate", help: "Estimated charge to deliver the takeaway to you", amountLabel: "Estimated courier charge", etaLabel: "Ride time", mark: <Bike aria-hidden size={22} />, markClass: "bg-warn-tint text-warn" },
};

type Upload =
  | { phase: "idle" }
  | { phase: "preview"; url: string }
  | { phase: "processing"; url: string }
  | { phase: "error"; url?: string; file?: File; message: string };

/**
 * One price source. Swiggy/Zomato accept a checkout screenshot (read by Gemini
 * when configured) and always allow typing the amount instead.
 */
export function SourceCard({
  source,
  quote,
  quantity,
  onQuote,
}: {
  source: SourceId;
  quote: PriceQuote | undefined;
  quantity: number;
  onQuote: (quote: PriceQuote | undefined) => void;
}) {
  const meta = META[source];
  const caps = useCapabilities();
  const isApp = source === "swiggy" || source === "zomato";
  const [upload, setUpload] = useState<Upload>({ phase: "idle" });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrl = "url" in upload ? upload.url : undefined;

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const setAmount = (paise: number | null) => {
    if (paise === null) return onQuote(undefined);
    onQuote({
      source,
      amountPaise: paise,
      quantity,
      capturedAt: new Date().toISOString(),
      // A typed or corrected amount is the user's own entry.
      status: source === "courier" ? "estimated" : "user_entered",
      etaMinutes: quote?.etaMinutes,
    });
    setWarnings([]);
  };

  const read = async (file: File, url: string) => {
    setUpload({ phase: "processing", url });
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("source", source);
      body.set("quantity", String(quantity));
      const response = await fetch("/api/extract", { method: "POST", body });
      const json = (await response.json()) as { extraction?: Extraction; message?: string };
      if (!response.ok || !json.extraction) {
        setUpload({ phase: "error", url, file, message: json.message ?? "Couldn't read this screenshot. Enter the amount yourself." });
        return;
      }
      const e = json.extraction;
      onQuote({
        source,
        amountPaise: e.finalPayablePaise,
        quantity,
        capturedAt: new Date().toISOString(),
        status: "ai_extracted_review",
        etaMinutes: e.etaMinutes,
        breakdown: e.breakdown,
        confidence: e.confidence,
      });
      setWarnings(e.warnings);
      setResetKey((k) => k + 1);
      setUpload({ phase: "preview", url });
    } catch {
      setUpload({ phase: "error", url, file, message: "Network problem while reading the screenshot. Try again or enter the amount yourself." });
    }
  };

  const pick = (file: File) => {
    if (!SCREENSHOT_TYPES.includes(file.type)) {
      setUpload({ phase: "error", message: "Use a PNG, JPEG or WebP screenshot." });
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setUpload({ phase: "error", message: "The screenshot must be smaller than 5 MB." });
      return;
    }
    const url = URL.createObjectURL(file);
    if (caps.screenshotExtraction) void read(file, url);
    else setUpload({ phase: "preview", url });
  };

  const remove = () => {
    setUpload({ phase: "idle" });
    setWarnings([]);
    setResetKey((k) => k + 1);
    onQuote(undefined);
  };

  return (
    <Card className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <span aria-hidden className={`flex size-11 shrink-0 items-center justify-center rounded-btn text-[18px] font-bold ${meta.markClass}`}>{meta.mark}</span>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold leading-snug">
            {meta.name} {quote?.demo ? <DemoBadge /> : null}
          </h3>
          <p className="text-[14px] leading-snug text-ink2">{meta.help}</p>
        </div>
        {quote || upload.phase !== "idle" ? (
          <IconButton label={`Remove ${meta.name} price`} onClick={remove} className="border border-line">
            <Trash2 aria-hidden size={18} />
          </IconButton>
        ) : null}
      </div>

      {isApp ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept={SCREENSHOT_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) pick(file);
              e.target.value = "";
            }}
          />
          {previewUrl ? (
            <div className="flex items-center gap-3 rounded-btn bg-fill p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={previewUrl} alt={`Your ${meta.name} screenshot`} className="h-16 w-12 rounded-md object-cover" />
              <div className="min-w-0 flex-1 text-[14px] text-ink2">
                {upload.phase === "processing" ? (
                  <Spinner label="Reading screenshot…" />
                ) : caps.screenshotExtraction ? (
                  "Screenshot read. Check the amount below."
                ) : (
                  "Screenshot added. Automatic reading isn't set up, so type the final amount shown in it."
                )}
              </div>
              <IconButton label={`Replace ${meta.name} screenshot`} onClick={() => fileRef.current?.click()} disabled={upload.phase === "processing"}>
                <RefreshCw aria-hidden size={18} />
              </IconButton>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <ImageUp aria-hidden size={20} /> Upload checkout screenshot
            </Button>
          )}
          {upload.phase === "error" ? (
            <div className="flex flex-col gap-2">
              <FieldError>{upload.message}</FieldError>
              {upload.file && upload.url ? (
                <Button variant="secondary" onClick={() => upload.file && upload.url && void read(upload.file, upload.url)}>Try reading again</Button>
              ) : null}
            </div>
          ) : null}
          {caps.screenshotExtraction && !previewUrl ? (
            <p className="text-[13px] leading-snug text-ink2">Uploading sends the image to Google Gemini to read the amounts. Rusi doesn&apos;t keep it.</p>
          ) : null}
        </>
      ) : null}

      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-end gap-2">
        <PriceInput key={resetKey} label={meta.amountLabel} valuePaise={quote?.amountPaise} onChange={setAmount} />
        <MinutesInput
          key={`eta-${resetKey}`}
          label={meta.etaLabel}
          value={quote?.etaMinutes}
          onChange={(etaMinutes) => quote && onQuote({ ...quote, etaMinutes })}
        />
      </div>

      {warnings.map((w) => <Notice key={w} tone="warn">{w}</Notice>)}
      {quote ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SourceStatus status={quote.status} />
          {quote.status === "ai_extracted_review" ? (
            <button
              type="button"
              onClick={() => { onQuote({ ...quote, status: "verified_checkout" }); setWarnings([]); }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-btn bg-primary px-3 text-[15px] font-semibold text-white active:opacity-75"
            >
              <Check aria-hidden size={18} /> Amount is correct
            </button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
