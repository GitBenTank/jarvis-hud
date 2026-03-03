# OpenClaw Ingress Signing

How to sign requests to `POST /api/ingress/openclaw` for Jarvis HUD integration.

**Full handoff protocol:** See [OpenClaw Integration Verification](../openclaw-integration-verification.md) for the deterministic runbook (Jarvis + OpenClaw + smoke + UI verification).

---

## Smoke Test (Local Validation)

Validate ingress end-to-end without OpenClaw. Use `dev:port` to avoid port collisions:

```bash
# Terminal 1: start dev on desired port (e.g. 3001)
JARVIS_INGRESS_OPENCLAW_ENABLED=true \
JARVIS_INGRESS_OPENCLAW_SECRET="your-32-char-secret-minimum" \
JARVIS_INGRESS_ALLOWLIST_CONNECTORS=openclaw \
PORT=3001 pnpm dev:port

# Terminal 2: smoke (point at same port)
JARVIS_INGRESS_OPENCLAW_SECRET="your-32-char-secret-minimum" \
JARVIS_HUD_BASE_URL="http://127.0.0.1:3001" \
pnpm ingress:smoke
```

**Expected output (success):**
```
Ingress smoke OK
id: <uuid>
traceId: <uuid>
status: pending
```

**Preflight:** Run `pnpm jarvis:doctor` (with same `JARVIS_HUD_BASE_URL` and ingress env) to check readiness before smoke or demos.

**Common failure modes:**

| Status | Cause |
|--------|-------|
| 401 | Signature invalid or timestamp out of window; check secret, clock sync |
| 403 | Ingress disabled, secret missing, or connector not in allowlist |
| 429 | Rate limit (60/min per IP); wait and retry |

---

## Endpoint

```
POST /api/ingress/openclaw
Content-Type: application/json
X-Jarvis-Timestamp: <unix-ms-epoch-string>
X-Jarvis-Nonce: <uuid-or-unique-string>
X-Jarvis-Signature: <hex-hmac-sha256>
```

---

## Signature Message Format

```
${timestamp}.${nonce}.${rawBody}
```

- `timestamp` — same value as `X-Jarvis-Timestamp` header (unix milliseconds as string)
- `nonce` — same value as `X-Jarvis-Nonce` header
- `rawBody` — exact UTF-8 body as sent (no trimming, no re-serialization)

The raw body must be identical byte-for-byte. Do not prettify or minify JSON after computing the signature.

---

## Timestamp Rules

| Condition | Result |
|-----------|--------|
| Timestamp older than `now - 5 minutes` | 401 Rejected |
| Timestamp newer than `now + 2 minutes` | 401 Rejected |
| Timestamp within window | Accepted |

Use `Date.now().toString()` for current time in ms.

---

## Node.js Signature Example

```javascript
const crypto = require("node:crypto");

function signRequest(secret, timestamp, nonce, rawBody) {
  const message = `${timestamp}.${nonce}.${rawBody}`;
  return crypto
    .createHmac("sha256", secret)
    .update(message, "utf8")
    .digest("hex");
}

// Usage
const secret = process.env.JARVIS_INGRESS_OPENCLAW_SECRET;
const timestamp = Date.now().toString();
const nonce = crypto.randomUUID();
const rawBody = JSON.stringify({
  kind: "system.note",
  title: "Test",
  summary: "Test summary",
  payload: {},
  source: { connector: "openclaw" },
});

const signature = signRequest(secret, timestamp, nonce, rawBody);
```

---

## curl Example

```bash
# Set these before running
SECRET="your-32-char-secret-minimum"
BODY='{"kind":"system.note","title":"Test","summary":"Test summary","payload":{},"source":{"connector":"openclaw"}}'
TIMESTAMP=$(date +%s)000  # Approx; prefer using Node/script for precision
NONCE=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "manual-$(date +%s)")

# Compute signature (Node required)
SIG=$(node -e "
const crypto = require('crypto');
const msg = process.argv[1] + '.' + process.argv[2] + '.' + process.argv[3];
console.log(crypto.createHmac('sha256', process.argv[4]).update(msg).digest('hex'));
" "$TIMESTAMP" "$NONCE" "$BODY" "$SECRET")

curl -X POST http://localhost:3000/api/ingress/openclaw \
  -H "Content-Type: application/json" \
  -H "X-Jarvis-Timestamp: $TIMESTAMP" \
  -H "X-Jarvis-Nonce: $NONCE" \
  -H "X-Jarvis-Signature: $SIG" \
  -d "$BODY"
```

For ms-precision timestamp in bash:

```bash
TIMESTAMP=$(node -e "console.log(Date.now())")
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| 403 Ingress disabled | `JARVIS_INGRESS_OPENCLAW_ENABLED` not `"true"` | Set env and restart |
| 403 Ingress secret missing | Secret unset or < 32 chars | Set `JARVIS_INGRESS_OPENCLAW_SECRET` |
| 403 Connector not in allowlist | `openclaw` not in `JARVIS_INGRESS_ALLOWLIST_CONNECTORS` | Set to `openclaw` or `openclaw,other` |
| 401 Invalid signature | Wrong secret, message format, or body mismatch | Verify secret matches, message format `${ts}.${nonce}.${rawBody}`, body identical |
| 401 Timestamp out of window | Clock drift or stale timestamp | Sync clocks; ensure timestamp is current ms epoch |
| 409 Nonce replay | Same nonce used twice | Generate new nonce per request |
| 400 Invalid body | Missing kind/title/summary/source or wrong source.connector | Ensure `source.connector === "openclaw"` |
| 429 Rate limit exceeded | More than 60 requests/min from same IP | Wait for window to reset; Retry-After header indicates seconds |

**Clock drift:** If client and server clocks differ by more than 5 minutes, requests will fail. Use `GET /api/config` and check `serverTime` to compare.
