/**
 * In-memory LRU nonce cache for replay protection.
 * Rejects reused nonces; cache does not persist across process restarts.
 */

const DEFAULT_MAX = 2000;

export class NonceCache {
  private max: number;
  private map = new Map<string, number>();
  private order: string[] = [];

  constructor(maxSize: number = DEFAULT_MAX) {
    this.max = Math.max(1, maxSize);
  }

  /** Returns true if nonce was already seen (replay). */
  has(nonce: string): boolean {
    return this.map.has(nonce);
  }

  /** Add nonce to cache. Call after verifying signature. */
  add(nonce: string): void {
    if (this.map.has(nonce)) return;
    while (this.order.length >= this.max) {
      const evicted = this.order.shift();
      if (evicted) this.map.delete(evicted);
    }
    this.order.push(nonce);
    this.map.set(nonce, Date.now());
  }

  /** Reset cache. For tests only. */
  reset(): void {
    this.map.clear();
    this.order = [];
  }
}

let defaultCache: NonceCache | null = null;

/** Singleton nonce cache for ingress (process lifetime). */
export function getNonceCache(): NonceCache {
  if (!defaultCache) defaultCache = new NonceCache(2000);
  return defaultCache;
}
