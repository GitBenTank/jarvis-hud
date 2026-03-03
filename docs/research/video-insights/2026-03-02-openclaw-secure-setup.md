# Video Insight: OpenClaw Secure Setup (2026-03-02)

**Source:** OpenClaw usage video (secure setup guidance)  
**Date:** 2026-03-02  
**Method:** Summarize → Extract controls → Map to Jarvis

---

## Summary

The video advocates a defense-in-depth posture for AI tooling that receives external inputs or interacts with production systems. Core themes: default-deny for inbound data, separation of identities for different connectors, minimal network and privilege exposure, and observability as a security layer. The guidance emphasizes that prompt injection and supply-chain-style risks are reduced when you control who and what can create proposals.

---

## Extracted Concepts

### 1. Trusted Ingress

**Insight:** Only allowlisted external inputs should be permitted to create proposals; default deny.

**Risk:** Uncontrolled ingress increases prompt injection surface—malicious or unintended content can flow into the agent and influence proposals.

**Jarvis Control:** Define a policy model for trusted ingress (sources, senders, domains, file types). No auto-ingest of email or other channels today—this is a future connector policy.

| Status | Plan |
|--------|------|
| **Exists now** | Proposals enter via `/api/events` and `/api/drafts/content`; both require explicit POST. No automatic ingestion. |
| **Add now** | Document Trusted Ingress as a first-class security concept in `docs/security/trusted-ingress.md`; add to security posture UI copy. |
| **Future** | Implement allowlist policy when connectors (email, etc.) are added. |

---

### 2. Scoped Identities

**Insight:** Use separate accounts or service principals for connectors; never personal accounts.

**Risk:** Shared identity blurs accountability and expands blast radius if credentials are compromised.

**Jarvis Control:** Policy that connectors use dedicated identities. No connectors today; document the pattern for future design.

| Status | Plan |
|--------|------|
| **Exists now** | No external connectors; events carry `agent` field for provenance. |
| **Add now** | Add “Scoped connector identities” to security posture planned controls. |
| **Future** | When connectors ship, enforce separate identities per connector. |

---

### 3. Least Privilege + Network Exposure

**Insight:** Localhost binding, firewall/VPN if remote, non-root execution.

**Risk:** Overprivileged or overly exposed processes increase attack surface.

**Jarvis Control:** HUD binds to localhost by default; no outbound posting. Document posture for deployment guidance.

| Status | Plan |
|--------|------|
| **Exists now** | Dev server binds `127.0.0.1`; no external posting; local-first artifacts. |
| **Add now** | Acknowledge in trusted-ingress and deployment guidance (if any). |
| **Future** | Deployment hardening guide (firewall, VPN, process user). |

---

### 4. Observability as Security

**Insight:** Logs, traces, and reconstruction are security controls—they enable audit and incident response.

**Risk:** Lack of visibility prevents accountability and post-incident analysis.

**Jarvis Control:** Trace reconstruction, action log, and bundle artifacts already provide observability.

| Status | Plan |
|--------|------|
| **Exists now** | Trace API, action log (JSONL), bundle manifests, Trace Timeline View. |
| **Add now** | Explicitly link observability to security in agent-execution-model. |
| **Future** | Immutable audit export, compliance exports. |

---

### 5. API Key Limits / Alerts

**Insight:** Policy for outbound API keys: rate limits, usage alerts, scoped permissions.

**Risk:** Unbounded or overprivileged API access enables abuse or exfiltration.

**Jarvis Control:** Future policy layer for any outbound connectors. No outbound today.

| Status | Plan |
|--------|------|
| **Exists now** | No external posting; no API keys in use. |
| **Add now** | Add “Key limits/alerts” to security posture planned controls. |
| **Future** | Policy-gated outbound; rate limits and alerts when connectors enable external APIs. |
