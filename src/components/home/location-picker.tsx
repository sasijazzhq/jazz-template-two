"use client";

import { ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Notice } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/sheet";
import { setLocation, useHydrated, useStore } from "@/lib/store";

/** Permission-aware location: typed area, or device location only when the user asks. */
export function LocationPicker() {
  const hydrated = useHydrated();
  const { location } = useStore();
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useDevice = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This browser can't share your location. Type your area instead.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        setLocation({ label: "Current location", source: "device", lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOpen(false);
      },
      (err) => {
        setBusy(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Type your area instead, or allow location in your browser settings."
            : "Couldn't get your location. Type your area instead.",
        );
      },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const label = hydrated && location ? location.label : "Set location";
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setArea(location?.source === "user_entered" ? location.label : "");
          setError(null);
          setOpen(true);
        }}
        className="inline-flex min-h-11 max-w-full items-center gap-1.5 self-start rounded-btn border border-line bg-card px-3 text-[16px] active:opacity-70"
      >
        <MapPin aria-hidden size={18} className="shrink-0 text-green" />
        <span className="sr-only">Location: </span>
        <span className="truncate">{label}</span>
        <ChevronDown aria-hidden size={18} className="shrink-0 text-ink2" />
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Your location" description="Used to help you pick the right restaurant branch. It stays on this device.">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const value = area.trim();
            if (!value) {
              setError("Type an area, for example Velachery, Chennai.");
              return;
            }
            setLocation({ label: value, source: "user_entered" });
            setOpen(false);
          }}
        >
          <label htmlFor="area" className="text-[15px] font-medium">Area or locality</label>
          <input
            id="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            autoComplete="address-level2"
            placeholder="e.g. Velachery, Chennai"
            maxLength={80}
            className="min-h-12 rounded-btn border border-line bg-card px-3 text-[17px]"
          />
          {error ? <FieldError>{error}</FieldError> : null}
          <Button type="submit">Save location</Button>
          <Button variant="secondary" onClick={useDevice} disabled={busy}>
            <LocateFixed aria-hidden size={20} />
            {busy ? "Getting location…" : "Use my current location"}
          </Button>
          <Notice>Rusi asks for device location only when you tap this button. Without a connected maps provider it can&apos;t show distances yet.</Notice>
          {location ? (
            <Button variant="ghost" onClick={() => { setLocation(null); setOpen(false); }}>
              Clear location
            </Button>
          ) : null}
        </form>
      </Sheet>
    </>
  );
}
