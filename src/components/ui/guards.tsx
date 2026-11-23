"use client";

import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "./button";
import { EmptyState, Spinner } from "./feedback";
import { type Session, useHydrated, useStore } from "@/lib/store";

/** Renders children with the current session, or a loading / empty state. */
export function WithSession({ children }: { children: (session: Session) => ReactNode }) {
  const hydrated = useHydrated();
  const { session } = useStore();
  if (!hydrated) return <Spinner label="Loading your order…" />;
  if (!session) {
    return (
      <EmptyState icon={<SearchX aria-hidden size={24} />} title="Nothing to compare yet">
        <p>Start by telling Rusi what you want to order.</p>
        <ButtonLink href="/">Go to Home</ButtonLink>
      </EmptyState>
    );
  }
  return <>{children(session)}</>;
}
