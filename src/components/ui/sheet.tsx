"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Bottom sheet for small edits, breakdowns and consent. Focus-trapped, Esc to close. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-40 bg-black/45" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className="sheet-content safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[20px] bg-card shadow-xl"
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-4">
            <div className="min-w-0 pt-2">
              <Dialog.Title className="text-[20px] font-semibold leading-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-[15px] text-ink2">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink active:opacity-60"
            >
              <X aria-hidden size={20} />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 pb-2 pt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
