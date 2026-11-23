"use client";

import { useRouter } from "next/navigation";
import { Pencil, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { OrderSummary } from "@/components/comparison/order-summary";
import { LocationPicker } from "@/components/home/location-picker";
import { AppHeader, PageTitle, Screen, SectionTitle, StickyCTA } from "@/components/layout/screen";
import { BranchCard } from "@/components/restaurant/branch-card";
import { QuantityStepper } from "@/components/restaurant/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, FieldError, Notice, Spinner } from "@/components/ui/feedback";
import { WithSession } from "@/components/ui/guards";
import { Sheet } from "@/components/ui/sheet";
import { type BranchSearch, restaurantProvider } from "@/features/restaurant-discovery/provider";
import { type Session, patchSession, useStore } from "@/lib/store";

const inputClass = "min-h-12 w-full rounded-btn border border-line bg-card px-3 text-[17px]";

function EditOrderSheet({ session, open, onOpenChange }: { session: Session; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [item, setItem] = useState(session.itemName);
  const [restaurant, setRestaurant] = useState(session.restaurantName);
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Edit order" description="Changing the dish or restaurant clears the branch and any prices you added.">
      <form
        className="flex flex-col gap-3 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          const itemName = item.trim();
          const restaurantName = restaurant.trim();
          if (!itemName || !restaurantName) {
            setError("Enter both the dish and the restaurant.");
            return;
          }
          if (itemName !== session.itemName || restaurantName !== session.restaurantName) {
            patchSession({ itemName, restaurantName, branch: undefined, quotes: {}, compared: false, selectedOptionId: undefined, order: undefined });
          }
          onOpenChange(false);
        }}
      >
        <label htmlFor="edit-item" className="text-[15px] font-medium">Dish</label>
        <input id="edit-item" className={inputClass} value={item} maxLength={80} onChange={(e) => setItem(e.target.value)} />
        <label htmlFor="edit-restaurant" className="text-[15px] font-medium">Restaurant</label>
        <input id="edit-restaurant" className={inputClass} value={restaurant} maxLength={80} onChange={(e) => setRestaurant(e.target.value)} />
        {error ? <FieldError>{error}</FieldError> : null}
        <Button type="submit">Save</Button>
      </form>
    </Sheet>
  );
}

function ManualBranch({ session }: { session: Session }) {
  const [area, setArea] = useState(session.branch?.source === "user_entered" ? session.branch.area : "");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const value = area.trim();
        if (!value) {
          setError("Enter the branch area, for example Velachery, Chennai.");
          return;
        }
        setError(null);
        patchSession({ branch: { id: `user-${value.toLowerCase()}`, name: session.restaurantName, area: value, source: "user_entered" } });
      }}
    >
      <label htmlFor="branch-area" className="text-[15px] font-medium text-ink">Branch area</label>
      <input id="branch-area" className={inputClass} value={area} maxLength={80} placeholder="e.g. Velachery, Chennai" onChange={(e) => setArea(e.target.value)} />
      {error ? <FieldError>{error}</FieldError> : null}
      <Button type="submit" variant="secondary">Use this branch</Button>
    </form>
  );
}

function Branches({ session }: { session: Session }) {
  const { location } = useStore();
  const name = session.restaurantName;
  const [result, setResult] = useState<{ name: string; search: BranchSearch | "error" } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    restaurantProvider()
      .searchBranches(name, location)
      .then((search) => !cancelled && setResult({ name, search }))
      .catch(() => !cancelled && setResult({ name, search: "error" }));
    return () => {
      cancelled = true;
    };
  }, [name, location, attempt]);

  if (!result || result.name !== name) return <Spinner label="Looking for branches…" />;
  if (result.search === "error") {
    return (
      <ErrorState title="Couldn't load branches">
        <p>Check your connection and try again, or enter the branch yourself.</p>
        <Button variant="secondary" onClick={() => { setResult(null); setAttempt((n) => n + 1); }}>Try again</Button>
        <ManualBranch session={session} />
      </ErrorState>
    );
  }
  if (result.search.kind === "no_provider") {
    return (
      <>
        <EmptyState icon={<Store aria-hidden size={24} />} title="Enter the branch yourself">
          <p>Rusi isn&apos;t connected to a restaurant directory yet, so it can&apos;t list real branches of {name}. Tell it which branch you mean.</p>
          <ManualBranch session={session} />
        </EmptyState>
        {session.branch ? (
          <div role="radiogroup" aria-label="Selected branch">
            <BranchCard branch={session.branch} selected onSelect={() => {}} />
          </div>
        ) : null}
      </>
    );
  }
  const { branches, demo } = result.search;
  return (
    <>
      {demo ? <Notice tone="warn">Sample branches for the demo. They are not verified locations, and no distances are shown.</Notice> : null}
      <div role="radiogroup" aria-label="Restaurant branch" className="flex flex-col gap-2">
        {branches.map((branch) => (
          <BranchCard key={branch.id} branch={branch} selected={session.branch?.id === branch.id} onSelect={() => patchSession({ branch })} />
        ))}
      </div>
    </>
  );
}

function RestaurantName({ session }: { session: Session }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <EmptyState icon={<Store aria-hidden size={24} />} title="Which restaurant?">
      <p>Rusi compares one dish from one restaurant, so the prices are for the same food.</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) {
            setError("Enter the restaurant name.");
            return;
          }
          patchSession({ restaurantName: value.trim() });
        }}
      >
        <label htmlFor="restaurant-name" className="text-[15px] font-medium text-ink">Restaurant name</label>
        <input id="restaurant-name" className={inputClass} value={value} maxLength={80} onChange={(e) => setValue(e.target.value)} />
        {error ? <FieldError>{error}</FieldError> : null}
        <Button type="submit">Find branches</Button>
      </form>
      <p className="sr-only">Ordering {session.itemName}</p>
    </EmptyState>
  );
}

function Content({ session }: { session: Session }) {
  const { location } = useStore();
  const [editing, setEditing] = useState(false);
  const hasPrices = Object.keys(session.quotes).length > 0;
  return (
    <>
      <PageTitle title="Choose the branch">Pick the exact branch so every price is for the same order.</PageTitle>
      <OrderSummary
        session={session}
        action={
          <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-btn bg-tint px-3 text-[15px] font-semibold text-green active:opacity-70">
            <Pencil aria-hidden size={16} /> Edit
          </button>
        }
      />
      {editing ? <EditOrderSheet session={session} open onOpenChange={setEditing} /> : null}

      {session.restaurantName ? (
        <section aria-labelledby="branches" className="flex flex-col gap-3">
          <SectionTitle><span id="branches">Branches</span></SectionTitle>
          {!location ? (
            <div className="flex flex-col gap-2">
              <p className="text-[15px] text-ink2">No location set. Add one to help you choose a branch.</p>
              <LocationPicker />
            </div>
          ) : null}
          <Branches session={session} />
        </section>
      ) : (
        <RestaurantName session={session} />
      )}

      <Card className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="text-[17px] font-semibold">Quantity</p>
          <p className="text-[14px] text-ink2">{hasPrices ? "Changing this clears the prices you added." : "Portions of the same dish."}</p>
        </div>
        <QuantityStepper
          value={session.quantity}
          onChange={(quantity) => patchSession({ quantity, quotes: {}, compared: false, selectedOptionId: undefined, order: undefined })}
        />
      </Card>
    </>
  );
}

export default function RestaurantsPage() {
  const router = useRouter();
  const { session } = useStore();
  const ready = !!session?.restaurantName && !!session.branch;
  return (
    <Screen
      header={<AppHeader back="/" backLabel="Back to Home" step={1} />}
      footer={
        session ? (
          <StickyCTA hint={ready ? undefined : "Choose a branch to continue."}>
            <Button disabled={!ready} onClick={() => router.push("/compare")}>Continue to price comparison</Button>
          </StickyCTA>
        ) : null
      }
    >
      <WithSession>{(s) => <Content session={s} />}</WithSession>
    </Screen>
  );
}
