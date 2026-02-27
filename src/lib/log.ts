/**
 * Polling/debug logs are gated by JARVIS_LOG_POLLING=1 (server)
 * or NEXT_PUBLIC_JARVIS_LOG_POLLING=1 (client, inlined at build).
 * Default: no output during filming.
 */
export function logPoll(...args: unknown[]): void {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_JARVIS_LOG_POLLING !== "1") return;
  } else if (process.env.JARVIS_LOG_POLLING !== "1") {
    return;
  }
  console.log("[jarvis]", ...args);
}
