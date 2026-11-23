import { serverEnv } from "@/lib/env";
import type { Capabilities } from "@/lib/capabilities";
import { voiceCallProvider } from "@/features/restaurant-calling/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = serverEnv();
  const body: Capabilities = {
    screenshotExtraction: !!env.geminiApiKey,
    voiceCalls: voiceCallProvider().available,
  };
  return Response.json(body, { headers: { "cache-control": "no-store" } });
}
