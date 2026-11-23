/** What this deployment can really do. Sent to the browser; contains no secrets. */
export interface Capabilities {
  screenshotExtraction: boolean;
  voiceCalls: boolean;
}
export const NO_CAPABILITIES: Capabilities = { screenshotExtraction: false, voiceCalls: false };
