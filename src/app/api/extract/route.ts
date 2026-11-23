import { serverEnv } from "@/lib/env";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { ExtractionError, GeminiScreenshotExtractor } from "@/features/price-extraction/gemini";
import { MAX_SCREENSHOT_BYTES, SCREENSHOT_TYPES, normalizeExtraction } from "@/features/price-extraction/schema";

export const dynamic = "force-dynamic";

const error = (status: number, code: string, message: string) => Response.json({ code, message }, { status });

/**
 * POST multipart: file (image), source ("swiggy" | "zomato"), quantity.
 * The screenshot is held in memory for the request only and is never stored or logged.
 */
export async function POST(request: Request) {
  const env = serverEnv();
  if (!env.geminiApiKey) {
    return error(503, "not_configured", "Automatic screenshot reading is not set up.");
  }
  if (!allowRequest(`extract:${clientKey(request)}`, 10, 60_000)) {
    return error(429, "rate_limited", "Too many screenshots at once. Try again in a minute.");
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const source = form?.get("source");
  const quantity = Number.parseInt(String(form?.get("quantity") ?? "1"), 10);
  if (!(file instanceof File) || (source !== "swiggy" && source !== "zomato") || !(quantity >= 1 && quantity <= 99)) {
    return error(400, "bad_request", "Send a screenshot and its source.");
  }
  if (!SCREENSHOT_TYPES.includes(file.type)) {
    return error(415, "unsupported_type", "Use a PNG, JPEG or WebP screenshot.");
  }
  if (file.size === 0 || file.size > MAX_SCREENSHOT_BYTES) {
    return error(413, "too_large", "The screenshot must be smaller than 5 MB.");
  }

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const extractor = new GeminiScreenshotExtractor(env.geminiApiKey, env.geminiModel);
    const raw = await extractor.extract({ base64, mimeType: file.type });
    const result = normalizeExtraction(raw, { source, quantity });
    if (!result.ok) return error(422, "unreadable", result.message);
    return Response.json({ extraction: result.extraction });
  } catch (e) {
    if (e instanceof ExtractionError) {
      return error(e.code === "timeout" ? 504 : 502, e.code, "Couldn't read this screenshot. Try again or enter the amount yourself.");
    }
    return error(500, "internal", "Something went wrong reading the screenshot.");
  }
}
