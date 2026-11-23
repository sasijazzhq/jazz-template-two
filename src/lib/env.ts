import "server-only";

/** Server-side configuration. Never import this from a client component. */
export function serverEnv() {
  return {
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
    geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    voiceCallsEnabled:
      process.env.ENABLE_VOICE_CALLS === "true" &&
      !!process.env.ELEVENLABS_API_KEY &&
      !!process.env.ELEVENLABS_AGENT_ID &&
      !!process.env.ELEVENLABS_PHONE_NUMBER_ID,
  };
}
