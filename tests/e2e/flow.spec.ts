import { expect, test, type Page } from "@playwright/test";

const shot = (page: Page, name: string) => page.screenshot({ path: `docs/screenshots/${name}.png` });

test("demo order: compare, call manually, and only then show Order placed", async ({ page }) => {
  // 01 Home
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What are you craving?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  await shot(page, "01-home");
  await page.getByRole("button", { name: /Try a sample order/ }).click();

  // 02 Restaurant selection
  await expect(page).toHaveURL(/\/restaurants$/);
  await expect(page.getByRole("progressbar", { name: "Step 1 of 3" })).toBeVisible();
  const next = page.getByRole("button", { name: "Continue to price comparison" });
  await expect(next).toBeDisabled();
  await page.getByRole("radio", { name: /Velachery/ }).click();
  await expect(page.getByRole("radio", { name: /Velachery/ })).toBeChecked();
  await shot(page, "02-restaurant-selection");
  await next.click();

  // 03 Price collection
  await expect(page).toHaveURL(/\/compare$/);
  const compare = page.getByRole("button", { name: "Compare my options" });
  await expect(compare).toBeDisabled();
  await page.getByRole("button", { name: /Fill with sample prices/ }).click();
  await expect(page.getByLabel("Swiggy final payable amount")).toHaveValue("423");
  await expect(page.getByLabel("Estimated courier charge")).toHaveValue("55");
  await shot(page, "03-price-collection");
  await compare.click();

  // 04 Smart comparison — deterministic demo figures
  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByText("Best among compared options")).toBeVisible();
  await expect(page.getByText("₹88", { exact: true })).toBeVisible();
  await expect(page.getByText(/20\.8% less than Swiggy \(₹423\)/)).toBeVisible();
  await expect(page.getByRole("radio", { name: /Takeaway \+ courier/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Takeaway \+ courier/ })).toContainText("₹335");
  await expect(page.getByRole("radio", { name: /Self-pickup/ })).toContainText("₹280");
  await shot(page, "04-smart-comparison");
  await page.getByRole("button", { name: "See price breakdown" }).click();
  await expect(page.getByRole("dialog", { name: "Price breakdown" })).toBeVisible();
  await shot(page, "04b-price-breakdown");
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Let Rusi help me order" }).click();

  // 05 Order assistance — no payment, no simulated AI call
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.getByRole("heading", { name: "Call the restaurant" })).toBeVisible();
  await expect(page.getByText(/continue to pay/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Let Rusi AI call now" })).toHaveCount(0);
  await expect(page.getByText(/Rusi AI calling isn't available/)).toBeVisible();
  await shot(page, "05-order-assistance");
  await page.getByRole("button", { name: "Call restaurant myself" }).click();

  // 06 Status — "Order placed" only after approval + restaurant confirmation
  await expect(page).toHaveURL(/\/order\/status$/);
  await expect(page.getByRole("heading", { name: "Order status" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Order placed" })).toHaveCount(0);
  await page.getByLabel("Price the restaurant quoted").fill("280");
  await page.getByRole("button", { name: "Save what they said" }).click();
  await expect(page.getByRole("heading", { name: "Approve this order?" })).toBeVisible();
  await shot(page, "06a-awaiting-approval");
  await page.getByRole("button", { name: "Approve this order" }).click();
  await expect(page.getByRole("heading", { name: "Order placed" })).toHaveCount(0);
  await page.getByRole("button", { name: "Restaurant confirmed my order" }).click();
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
  await expect(page.getByText("Preparing", { exact: true })).toHaveCount(0); // never shown unless reported
  await shot(page, "06-order-status");

  await page.getByRole("button", { name: "It's ready for pickup" }).click();
  await page.getByLabel("Courier quote").fill("60");
  await page.getByRole("button", { name: "Save courier quote" }).click();
  await expect(page.getByText("₹340")).toBeVisible();
  await page.getByRole("button", { name: "Approve courier at this price" }).click();
  await page.getByRole("button", { name: "I've booked the courier" }).click();
  await page.getByRole("button", { name: "My order was delivered" }).click();
  await expect(page.getByRole("heading", { name: "Delivered" })).toBeVisible();

  // Savings: confirmed uses the real reported total (423 − 340)
  await page.getByRole("link", { name: "See my savings" }).click();
  await expect(page.getByRole("region", { name: "Confirmed" }).getByText("₹83").first()).toBeVisible();
  await shot(page, "07-savings");
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByText("Completed")).toBeVisible();
  await shot(page, "08-history");
});

test("typed search, manual branch and two prices are enough", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/What do you want to order/).fill("2 Masala Dosa from Sangeetha");
  await page.getByRole("button", { name: "Find branches" }).click();
  await expect(page.getByText("Masala Dosa × 2")).toBeVisible();
  await expect(page.getByText(/can't list real branches of Sangeetha/)).toBeVisible();
  await page.getByLabel("Branch area").fill("Adyar, Chennai");
  await page.getByRole("button", { name: "Use this branch" }).click();
  await page.getByRole("button", { name: "Continue to price comparison" }).click();

  const compare = page.getByRole("button", { name: "Compare my options" });
  await page.getByLabel("Zomato final payable amount").fill("31x");
  await expect(page.getByText(/Enter an amount in rupees/)).toBeVisible();
  await page.getByLabel("Zomato final payable amount").fill("310");
  await expect(compare).toBeDisabled();
  await expect(page.getByText("Add at least two prices to compare.")).toBeVisible();
  await page.getByLabel("Swiggy final payable amount").fill("342.50");
  await compare.click();

  await expect(page.getByText(/Comparing the 2 options you added/)).toBeVisible();
  await expect(page.getByText("₹32.50", { exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Zomato/ })).toBeChecked();
  // Fastest without ETAs must say it can't compare speed
  await page.getByRole("radio", { name: "Fastest" }).click();
  await expect(page.getByText(/Add a delivery time for each option/)).toBeVisible();
  // App option: Rusi does not pretend to order in the app
  await page.getByRole("button", { name: "Let Rusi help me order" }).click();
  await expect(page.getByRole("heading", { name: "Order in the Zomato app" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Call restaurant myself" })).toHaveCount(0);
});

test("failed call needs an outcome check before retrying", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Try a sample order/ }).click();
  await page.getByRole("radio", { name: /Adyar/ }).click();
  await page.getByRole("button", { name: "Continue to price comparison" }).click();
  await page.getByRole("button", { name: /Fill with sample prices/ }).click();
  await page.getByRole("button", { name: "Compare my options" }).click();
  await page.getByRole("button", { name: "Let Rusi help me order" }).click();
  await page.getByRole("button", { name: "Call restaurant myself" }).click();
  await page.getByRole("button", { name: "No answer" }).click();
  await expect(page.getByText("The restaurant didn't answer")).toBeVisible();
  await page.getByRole("button", { name: /Try calling again/ }).click();
  await expect(page.getByText(/Confirm that the last call did not place an order/)).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Try calling again/ }).click();
  await expect(page.getByRole("heading", { name: "Ready to call" })).toBeVisible();
  await shot(page, "06b-ready-to-retry");
});

test("deep links without a session show a recovery state", async ({ page }) => {
  for (const path of ["/restaurants", "/compare", "/results", "/order", "/order/status"]) {
    await page.goto(path);
    await expect(page.getByText("Nothing to compare yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Home" })).toBeVisible();
  }
});

test("integrations report unavailable without credentials", async ({ request }) => {
  expect(await (await request.get("/api/capabilities")).json()).toEqual({ screenshotExtraction: false, voiceCalls: false });
  const extract = await request.post("/api/extract", { multipart: { source: "swiggy", quantity: "1", file: { name: "a.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
  expect(extract.status()).toBe(503);
  expect((await extract.json()).code).toBe("not_configured");
  const call = await request.post("/api/calls", {
    data: { idempotencyKey: crypto.randomUUID(), restaurantName: "R", phoneE164: "+914412345678", itemName: "I", quantity: 1, consentAt: new Date().toISOString() },
  });
  expect(call.status()).toBe(501);
});
