"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Scale, ShoppingBag, Wallet } from "lucide-react";
import { useRef, useState } from "react";
import { LocationPicker } from "@/components/home/location-picker";
import { PrivacyButton } from "@/components/home/privacy-sheet";
import { PromptComposer } from "@/components/home/prompt-composer";
import { RecentSearchRow } from "@/components/home/recent-search-row";
import { AppHeader, Screen, SectionTitle, TabBar } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Card, DemoBadge, EmptyState } from "@/components/ui/feedback";
import { DEMO_QUERY } from "@/features/comparison-engine/demo-data";
import { parseQuery } from "@/features/restaurant-discovery/parse-query";
import { startSession, useHydrated, useStore } from "@/lib/store";
import type { Preference } from "@/types/domain";

const ACTIONS = [
  { id: "compare", label: "Compare food prices", Icon: Scale, preference: "balance", hint: "Rusi will compare every price you add and pick the best balance." },
  { id: "delivery", label: "Find cheapest delivery", Icon: Wallet, preference: "cheapest", hint: "Rusi will rank delivered options by the lowest final price." },
  { id: "takeaway", label: "Check takeaway savings", Icon: ShoppingBag, preference: "cheapest", hint: "Rusi will show what you save by ordering takeaway directly." },
] as const satisfies readonly { id: string; label: string; Icon: typeof Scale; preference: Preference; hint: string }[];

export default function HomePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { recent } = useStore();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<(typeof ACTIONS)[number]["id"] | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selected = ACTIONS.find((a) => a.id === action);

  const submit = (text: string) => {
    const parsed = parseQuery(text);
    if (!parsed) {
      setError("Tell Rusi the dish and the restaurant, for example “Chicken Biryani from SS Hyderabad Biryani”.");
      inputRef.current?.focus();
      return;
    }
    startSession(text.trim(), parsed, selected?.preference ?? "cheapest");
    router.push("/restaurants");
  };

  return (
    <Screen header={<AppHeader right={<PrivacyButton />} />} footer={<TabBar />}>
      <LocationPicker />

      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">What are you craving?</h1>
        <p className="text-[16px] text-ink2">Find the smartest way to order your favourite food.</p>
      </div>

      <PromptComposer
        value={prompt}
        onChange={(v) => { setPrompt(v); setError(null); }}
        onSubmit={() => submit(prompt)}
        error={error}
        inputRef={inputRef}
      />

      <section aria-labelledby="try" className="flex flex-col gap-3">
        <h2 id="try" className="text-[20px] font-semibold leading-tight">Try these</h2>
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={action === id}
              onClick={() => { setAction(action === id ? null : id); inputRef.current?.focus(); }}
              className={clsx(
                "flex min-h-[88px] flex-col items-start gap-2 rounded-card border p-3 text-left text-[14px] font-medium leading-snug active:opacity-70",
                action === id ? "border-primary bg-tint text-green" : "border-line bg-card text-ink",
              )}
            >
              <Icon aria-hidden size={22} className="text-green" />
              <span className="hyphens-auto break-words">{label}</span>
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-[14px] text-ink2">
          {selected ? selected.hint : "Pick a goal, then name the dish and restaurant."}
        </p>
      </section>

      <section aria-labelledby="recent" className="flex flex-col gap-3">
        <SectionTitle
          action={
            hydrated && recent.length > 0 ? (
              <Link href="/history" className="-my-2 inline-flex min-h-11 items-center text-[16px] font-medium text-green">See all</Link>
            ) : null
          }
        >
          <span id="recent">Recent searches</span>
        </SectionTitle>
        {hydrated && recent.length > 0 ? (
          <Card className="overflow-hidden">
            <ul>{recent.slice(0, 3).map((q) => <RecentSearchRow key={q} query={q} onSelect={submit} />)}</ul>
          </Card>
        ) : (
          <EmptyState title="No searches yet">
            <p>Your recent searches will appear here. They are saved only on this device.</p>
            <Button variant="secondary" onClick={() => submit(DEMO_QUERY)}>
              Try a sample order <DemoBadge />
            </Button>
          </EmptyState>
        )}
      </section>
    </Screen>
  );
}
