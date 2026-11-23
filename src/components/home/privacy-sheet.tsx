"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useCapabilities } from "@/lib/hooks";
import { clearAllData } from "@/lib/store";

export function PrivacyButton() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const caps = useCapabilities();
  return (
    <>
      <IconButton label="Privacy and data" onClick={() => { setDeleted(false); setOpen(true); }} className="-mr-2">
        <ShieldCheck aria-hidden size={24} />
      </IconButton>
      <Sheet open={open} onOpenChange={setOpen} title="Privacy and data">
        <div className="flex flex-col gap-3 pb-3 text-[15px] leading-relaxed text-ink">
          <p>Your searches, prices and order notes are saved only in this browser. There is no account and nothing is uploaded for storage.</p>
          <p>
            {caps.screenshotExtraction
              ? "When you upload a checkout screenshot, the image is sent to Google Gemini to read the amounts. Rusi does not keep the image after reading it."
              : "Screenshot reading is not set up in this build, so screenshots never leave your device."}
          </p>
          <p>Rusi does not place orders, take payments, call restaurants or book couriers in this build. You do those yourself.</p>
          <Button variant="danger" onClick={() => { clearAllData(); setDeleted(true); }}>
            Delete my data on this device
          </Button>
          <p role="status" className="min-h-5 text-[14px] text-ink2">{deleted ? "All Rusi data on this device was deleted." : ""}</p>
        </div>
      </Sheet>
    </>
  );
}
