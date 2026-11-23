import { z } from "zod";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { voiceCallProvider } from "@/features/restaurant-calling/provider";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  idempotencyKey: z.string().uuid(),
  restaurantName: z.string().min(1).max(120),
  phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/),
  itemName: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(99),
  consentAt: z.string().datetime(),
});

const seenKeys = new Map<string, unknown>();

/** Start one consented restaurant call. Idempotent per key; rate limited. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ code: "bad_request", message: "Invalid call request." }, { status: 400 });
  if (seenKeys.has(parsed.data.idempotencyKey)) return Response.json(seenKeys.get(parsed.data.idempotencyKey));
  if (!allowRequest(`calls:${clientKey(request)}`, 3, 10 * 60_000)) {
    return Response.json({ code: "rate_limited", message: "Too many call attempts. Try later." }, { status: 429 });
  }
  const result = await voiceCallProvider().startCall(parsed.data);
  if (!result.ok) return Response.json(result, { status: result.code === "not_configured" ? 501 : 502 });
  seenKeys.set(parsed.data.idempotencyKey, result);
  return Response.json(result);
}
