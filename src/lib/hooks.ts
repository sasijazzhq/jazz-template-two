"use client";

import { useSyncExternalStore } from "react";
import { type Capabilities, NO_CAPABILITIES } from "./capabilities";

// --- capabilities: fetched once from the server, never guessed on the client ---
let capabilities: Capabilities = NO_CAPABILITIES;
let requested = false;
const capListeners = new Set<() => void>();

function subscribeCapabilities(listener: () => void) {
  capListeners.add(listener);
  if (!requested) {
    requested = true;
    fetch("/api/capabilities")
      .then((r) => (r.ok ? (r.json() as Promise<Capabilities>) : NO_CAPABILITIES))
      .catch(() => NO_CAPABILITIES)
      .then((c) => {
        capabilities = { screenshotExtraction: !!c.screenshotExtraction, voiceCalls: !!c.voiceCalls };
        capListeners.forEach((l) => l());
      });
  }
  return () => capListeners.delete(listener);
}

export function useCapabilities(): Capabilities {
  return useSyncExternalStore(subscribeCapabilities, () => capabilities, () => NO_CAPABILITIES);
}

// --- a clock that ticks once a minute, so renders stay pure ---
let nowMs = 0;
const clockListeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      nowMs = Date.now();
      clockListeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Current time in ms, refreshed every minute. 0 during server render. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribeClock,
    () => (nowMs ||= Date.now()),
    () => 0,
  );
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
