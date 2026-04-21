/**
 * Optional operator probes (local dev). Gated by JARVIS_DEBUG_INTEGRATION.
 * Does not log bodies or secrets.
 */

export function isIntegrationDebugEnabled(): boolean {
  const v = process.env.JARVIS_DEBUG_INTEGRATION?.trim().toLowerCase();
  return v === "true" || v === "1";
}

export type ControlUiProbeResult = {
  ok: boolean;
  ms: number;
  httpStatus?: number;
  error?: string;
};

const PROBE_MS = 3500;

/**
 * Best-effort: TCP + HTTP response headers. Any HTTP status (including 401/404)
 * usually means something is listening; connection refused / timeout does not.
 */
export async function probeControlUiReachability(
  urlStr: string
): Promise<ControlUiProbeResult> {
  const started = Date.now();
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return {
        ok: false,
        ms: Date.now() - started,
        error: "URL must be http(s)",
      };
    }

    const acHead = new AbortController();
    const headTimer = setTimeout(() => acHead.abort(), PROBE_MS);
    let res: Response;
    try {
      res = await fetch(u.href, {
        method: "HEAD",
        signal: acHead.signal,
        redirect: "manual",
      });
    } finally {
      clearTimeout(headTimer);
    }

    if (res.status === 405) {
      const acGet = new AbortController();
      const getTimer = setTimeout(() => acGet.abort(), PROBE_MS);
      try {
        res = await fetch(u.href, {
          method: "GET",
          signal: acGet.signal,
          redirect: "manual",
          headers: { Accept: "text/html" },
        });
        await res.body?.cancel().catch(() => {});
      } finally {
        clearTimeout(getTimer);
      }
    }

    const ms = Date.now() - started;
    return {
      ok: true,
      ms,
      httpStatus: res.status,
    };
  } catch (e) {
    const ms = Date.now() - started;
    const err = e instanceof Error ? e.message : String(e);
    const lowered = err.toLowerCase();
    const friendly =
      lowered.includes("abort") || lowered.includes("timeout")
        ? `timeout after ${PROBE_MS}ms`
        : err;
    return { ok: false, ms, error: friendly };
  }
}
