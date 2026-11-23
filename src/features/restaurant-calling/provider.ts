import "server-only";

/**
 * Port for automated restaurant calls (planned: ElevenLabs Conversational AI
 * with a telephony number). No adapter is implemented yet, so calls are
 * always reported as unavailable and the app uses the guided manual flow.
 * Rusi never pretends a call happened.
 */
export interface CallRequest {
  idempotencyKey: string;
  restaurantName: string;
  phoneE164: string;
  itemName: string;
  quantity: number;
  /** ISO timestamp of the user's explicit consent to this one call. */
  consentAt: string;
}

export type CallStart =
  | { ok: true; callId: string }
  | { ok: false; code: "not_configured" | "provider_error"; message: string };

export interface VoiceCallProvider {
  readonly available: boolean;
  startCall(request: CallRequest): Promise<CallStart>;
}

class UnavailableVoiceCallProvider implements VoiceCallProvider {
  readonly available = false;
  async startCall(): Promise<CallStart> {
    return { ok: false, code: "not_configured", message: "Automated calling is not available in this build." };
  }
}

export function voiceCallProvider(): VoiceCallProvider {
  // When an ElevenLabs adapter exists, return it here if serverEnv().voiceCallsEnabled.
  return new UnavailableVoiceCallProvider();
}
