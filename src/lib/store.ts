"use client";

import { useSyncExternalStore } from "react";
import type { Branch, OptionId, Preference, QuoteMap, UserLocation } from "@/types/domain";
import { type OrderEvent, type OrderState, transition } from "@/features/order-assistance/machine";
import type { ParsedQuery } from "@/features/restaurant-discovery/parse-query";

/**
 * Local-first persistence. Everything lives in this browser's localStorage;
 * nothing is sent to a server. Screenshots are never stored here.
 */
export interface Session {
  id: string;
  createdAt: string;
  query: string;
  itemName: string;
  restaurantName: string;
  branch?: Branch;
  quantity: number;
  quotes: QuoteMap;
  preference: Preference;
  selectedOptionId?: OptionId;
  compared: boolean;
  restaurantPhone?: string;
  order?: OrderState;
}

export interface StoreState {
  version: 1;
  session: Session | null;
  history: Session[];
  recent: string[];
  location: UserLocation | null;
}

const KEY = "rusi.v1";
const EMPTY: StoreState = { version: 1, session: null, history: [], recent: [], location: null };

let state: StoreState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && (parsed as StoreState).version === 1) {
      state = { ...EMPTY, ...(parsed as StoreState) };
    }
  } catch {
    state = EMPTY; // unreadable or blocked storage: start clean, keep working in memory
  }
}

function commit(next: StoreState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode): the session still works in memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => EMPTY;
const noop = () => () => {};

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** False during server render and hydration, true once local data can be read. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function startSession(query: string, parsed: ParsedQuery, preference: Preference = "cheapest") {
  load();
  const previous = state.session;
  const session: Session = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    query,
    itemName: parsed.itemName,
    restaurantName: parsed.restaurantName ?? "",
    quantity: parsed.quantity,
    quotes: {},
    preference,
    compared: false,
  };
  commit({
    ...state,
    session,
    history: previous ? [previous, ...state.history].slice(0, 20) : state.history,
    recent: [query, ...state.recent.filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, 5),
  });
}

export function patchSession(patch: Partial<Session>) {
  if (!state.session) return;
  commit({ ...state, session: { ...state.session, ...patch } });
}

/** Apply a state-machine event to the current order. Returns an error message when rejected. */
export function dispatchOrder(event: OrderEvent): string | null {
  const order = state.session?.order;
  if (!order) return "There is no order in progress.";
  const result = transition(order, event, new Date().toISOString());
  if (!result.ok) return result.reason;
  patchSession({ order: result.state });
  return null;
}

export function resumeSession(id: string) {
  const target = state.history.find((s) => s.id === id);
  if (!target) return;
  const rest = state.history.filter((s) => s.id !== id);
  commit({ ...state, session: target, history: state.session ? [state.session, ...rest] : rest });
}

export function setLocation(location: UserLocation | null) {
  load();
  commit({ ...state, location });
}

/** Deletion control: removes every Rusi record from this device. */
export function clearAllData() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  state = EMPTY;
  listeners.forEach((l) => l());
}

export function routeForSession(session: Session): string {
  if (session.order && session.order.status !== "option_selected") return "/order/status";
  if (session.compared) return "/results";
  if (session.branch) return "/compare";
  return "/restaurants";
}
