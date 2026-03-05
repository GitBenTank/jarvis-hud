import { createHash } from "node:crypto";

/**
 * Compute SHA256 of the raw patch text exactly as executed.
 * Uses UTF-8 encoding. Returns hex string (lowercase).
 */
export function computePatchSha256(patchText: string): string {
  return createHash("sha256").update(patchText, "utf8").digest("hex");
}
