# Product

**Rusi AI — Same food. Smarter spending.** Helps people in India see the true final cost of one food order across the ways they could buy it, and take the best next step.

## The comparison
For one dish, one restaurant branch and one quantity:

| Option | Kind | Total |
|---|---|---|
| Swiggy | Delivered | Final payable on the Swiggy checkout |
| Zomato | Delivered | Final payable on the Zomato checkout |
| Takeaway + courier | Delivered | Restaurant takeaway price + courier charge (estimate until quoted) |
| Self-pickup | Pickup | Restaurant takeaway price |

Self-pickup is reported separately because it costs the user a trip. Two comparable options are enough.

## Flow
1. **Home `/`** — say what you want ("Chicken Biryani from SS Hyderabad Biryani").
2. **Restaurant `/restaurants`** — pick the branch and quantity (step 1/3).
3. **Prices `/compare`** — add final amounts by screenshot or typing (step 2/3).
4. **Results `/results`** — recommendation, saving, breakdown (step 3/3).
5. **Order help `/order`** — what the restaurant call covers; call yourself (or, later, let Rusi AI call).
6. **Status `/order/status`** — a timeline of what has really been reported.

Secondary: **Savings** (confirmed vs potential) and **History**.

## Principles
- Trust before delight: every price shows where it came from; estimates and demo data are labelled.
- Rusi never places an order, pays, calls or books a courier without explicit approval, and never pretends it did.
- "Best among compared options", never "cheapest everywhere".
- No login is needed to compare.

## Demo data (illustrative only)
Swiggy ₹423, Zomato ₹395, takeaway ₹280, courier estimate ₹55 → takeaway + courier ₹335, saving ₹88 vs Swiggy (20.8%).

## Not in scope
Payments, ordering inside Swiggy/Zomato, scraping or unofficial APIs, live delivery tracking.
