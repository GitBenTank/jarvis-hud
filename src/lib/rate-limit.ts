/**
 * In-memory rate limiter for connector ingress.
 * Fixed window: 60 requests per 60,000ms per IP.
 * No persistence; safe for dev/test.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

type WindowState = {
  count: number;
  windowStartMs: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export class IngressRateLimiter {
  private map = new Map<string, WindowState>();

  check(ip: string): RateLimitResult {
    const now = Date.now();
    const state = this.map.get(ip);

    if (!state) {
      this.map.set(ip, { count: 1, windowStartMs: now });
      return { ok: true };
    }

    const elapsed = now - state.windowStartMs;
    if (elapsed >= WINDOW_MS) {
      this.map.set(ip, { count: 1, windowStartMs: now });
      return { ok: true };
    }

    state.count += 1;
    if (state.count > MAX_PER_WINDOW) {
      const retryAfterSec = Math.ceil((WINDOW_MS - elapsed) / 1000);
      return { ok: false, retryAfterSec };
    }

    return { ok: true };
  }

  reset(): void {
    this.map.clear();
  }
}

let defaultLimiter: IngressRateLimiter | null = null;

export function getIngressRateLimiter(): IngressRateLimiter {
  if (!defaultLimiter) defaultLimiter = new IngressRateLimiter();
  return defaultLimiter;
}
