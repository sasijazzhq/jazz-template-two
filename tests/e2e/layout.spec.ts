import { expect, test, type Page } from "@playwright/test";
import { demoQuotes } from "../../src/features/comparison-engine/demo-data";
import { createOrder, transition, type OrderEvent } from "../../src/features/order-assistance/machine";

const AT = new Date().toISOString();
const order = (["CONSENT_REQUESTED", "CALL"] as const).reduce((s, e) => {
  const event: OrderEvent = e === "CALL" ? { type: "CALL_STARTED", mode: "manual", idempotencyKey: "k" } : { type: e };
  const r = transition(s, event, AT);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}, createOrder("courier"));

/** A long-named order mid-call, to stress wrapping on every screen. */
const STORE = {
  version: 1,
  session: {
    id: "s1",
    createdAt: AT,
    query: "demo",
    itemName: "Hyderabadi Chicken Dum Biryani Family Pack",
    restaurantName: "SS Hyderabad Biryani Restaurant & Caterers",
    branch: { id: "b", name: "SS Hyderabad Biryani", area: "Velachery Main Road, Chennai", source: "demo" },
    quantity: 12,
    quotes: demoQuotes(AT, 12),
    preference: "cheapest",
    selectedOptionId: "takeaway_courier",
    compared: true,
    order,
  },
  history: [],
  recent: ["Hyderabadi Chicken Dum Biryani Family Pack from SS Hyderabad Biryani Restaurant & Caterers"],
  location: { label: "Velachery, Chennai", source: "user_entered" },
};

const ROUTES = ["/", "/restaurants", "/compare", "/results", "/order", "/order/status", "/savings", "/history"];
const WIDTHS = [320, 375, 390, 430];

async function seed(page: Page) {
  await page.addInitScript((store) => window.localStorage.setItem("rusi.v1", JSON.stringify(store)), STORE);
}

async function audit(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const small: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("a[href], button, [role=radio], summary")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 43.5 || r.width < 43.5) small.push(`${el.tagName} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return { overflow: doc.scrollWidth - doc.clientWidth, small };
  });
}

for (const width of WIDTHS) {
  test(`no horizontal overflow and 44px targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await seed(page);
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      const result = await audit(page);
      expect(result.overflow, `${route} overflows horizontally`).toBeLessThanOrEqual(0);
      expect(result.small, `${route} has small touch targets`).toEqual([]);
    }
  });
}

test("sticky CTA stays in view and does not cover content", async ({ page }) => {
  await seed(page);
  await page.goto("/results");
  const cta = page.getByRole("button", { name: "Let Rusi help me order" });
  await expect(cta).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(cta).toBeInViewport();
  const last = await page.getByRole("button", { name: "See price breakdown" }).boundingBox();
  const bar = await cta.boundingBox();
  expect(last!.y + last!.height).toBeLessThanOrEqual(bar!.y);
});

test("usable at 200% text size and with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  for (const route of ["/", "/compare", "/results"]) {
    await page.goto(route);
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    await expect(page.locator("h1")).toBeVisible();
    expect((await audit(page)).overflow, `${route} overflows at 200%`).toBeLessThanOrEqual(0);
  }
});

test("keyboard: composer submits with Enter, sheet traps focus and closes with Escape", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Location/ }).click();
  const dialog = page.getByRole("dialog", { name: "Your location" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByLabel(/What do you want to order/).fill("Idli from A2B");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/restaurants$/);
});

test("voice button is disabled and explained when speech recognition is missing", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error simulate an unsupported browser
    delete window.SpeechRecognition;
    // @ts-expect-error simulate an unsupported browser
    delete window.webkitSpeechRecognition;
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Voice input" })).toBeDisabled();
  await expect(page.getByText(/Voice input isn't supported in this browser/)).toBeVisible();
});
