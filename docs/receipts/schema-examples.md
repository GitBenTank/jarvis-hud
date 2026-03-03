# Receipt Schema Examples

Example action log entries and manifest structures for each adapter, for schema consistency review.

---

## Action Log (JSONL) — `actions/{date}.jsonl`

One line per executed action.

All entries include `traceId` to group proposal → approval → execution for replay.

### code.diff

```json
{"id":"a1b2c3d4-...","traceId":"t9z8y7x6-...","at":"2026-02-25T12:00:00.000Z","kind":"code.diff","approvalId":"e5f6g7h8-...","status":"executed","summary":"Dry-run change bundle","outputPath":"/Users/me/jarvis/code-diffs/2026-02-25/e5f6g7h8-..."}
```

### code.apply

Receipt metadata only — no raw diff or payload. Richer data lives in the bundle.

```json
{"id":"a1b2c3d4-...","traceId":"t9z8y7x6-...","at":"2026-02-25T12:00:00.000Z","kind":"code.apply","approvalId":"e5f6g7h8-...","status":"executed","summary":"Add feature X","outputPath":"/Users/me/jarvis/code-applies/2026-02-25/e5f6g7h8-...","commitHash":"abc123def456...","rollbackCommand":"git revert abc123def456...","noChangesApplied":false,"filesChanged":["src/lib/foo.ts","src/utils/bar.ts"],"statsText":"abc123d jarvis: apply e5f6g7h8 — Add feature X\n src/lib/foo.ts | 5 +++++\n src/utils/bar.ts | 3 +++\n 2 files changed, 8 insertions(+)","statsJson":{"filesChangedCount":2,"insertions":8,"deletions":0},"repoHeadBefore":"1a2b3c...","repoHeadAfter":"abc123def456..."}
```

### content.publish

```json
{"id":"a1b2c3d4-...","traceId":"t9z8y7x6-...","at":"2026-02-25T12:00:00.000Z","kind":"content.publish","approvalId":"e5f6g7h8-...","status":"written","summary":"Blog post title","artifactPath":"/Users/me/jarvis/publish-queue/2026-02-25/e5f6g7h8-....json"}
```

### youtube.package

```json
{"id":"a1b2c3d4-...","traceId":"t9z8y7x6-...","at":"2026-02-25T12:00:00.000Z","kind":"youtube.package","approvalId":"e5f6g7h8-...","status":"executed","summary":"Jarvis HUD video","outputPath":"/Users/me/jarvis/youtube-packages/2026-02-25/e5f6g7h8-..."}
```

### system.note

```json
{"id":"a1b2c3d4-...","traceId":"t9z8y7x6-...","at":"2026-02-25T12:00:00.000Z","kind":"system.note","approvalId":"e5f6g7h8-...","status":"executed","summary":"Decision log entry","outputPath":"/Users/me/jarvis/system-notes/2026-02-25/e5f6g7h8-....md"}
```

---

## Manifest — code.apply bundle

`code-applies/{dateKey}/{approvalId}/manifest.json`:

Richer payload (including diff) lives here; action log holds only receipt metadata.

```json
{
  "kind": "code.apply",
  "traceId": "t9z8y7x6-...",
  "approvalId": "e5f6g7h8-...",
  "createdAt": "2026-02-25T12:00:00.000Z",
  "dateKey": "2026-02-25",
  "dryRun": false,
  "outputPath": "/Users/me/jarvis/code-applies/2026-02-25/e5f6g7h8-...",
  "title": "Add feature X",
  "repoRoot": "/Users/me/repos/my-app",
  "commitHash": "abc123def456...",
  "rollbackCommand": "git revert abc123def456...",
  "filesChanged": ["src/lib/foo.ts", "src/utils/bar.ts"],
  "statsText": "abc123d jarvis: apply e5f6g7h8 — Add feature X\n src/lib/foo.ts | 5 +++++\n src/utils/bar.ts | 3 +++\n 2 files changed, 8 insertions(+)",
  "statsJson": { "filesChangedCount": 2, "insertions": 8, "deletions": 0 },
  "repoHeadBefore": "1a2b3c...",
  "repoHeadAfter": "abc123def456...",
  "noChangesApplied": false
}
```

---

## Common Fields (all action log entries)

| Field | Required | Description |
|-------|----------|-------------|
| id | yes | UUID |
| traceId | yes | Groups proposal → approval → execution; replay seed |
| at | yes | ISO timestamp |
| kind | yes | Adapter kind |
| approvalId | yes | Event/proposal ID |
| status | yes | executed, written, etc. |
| summary | yes | Human-readable summary |
| outputPath | no | Path to bundle/artifact |
| artifactPath | no | Path to publish artifact (content.publish) |

**Redaction rule:** Never log raw diffs, content bodies, or credentials in the JSONL. Richer payload lives in the bundle.

## code.apply–specific

| Field | Description |
|-------|-------------|
| commitHash | Git commit SHA |
| rollbackCommand | `git revert <hash>` |
| noChangesApplied | true if diff applied but nothing staged |
| filesChanged | Paths touched |
| statsText | `git show --stat --oneline --no-patch HEAD` (human-readable) |
| statsJson | `{ filesChangedCount, insertions, deletions }` for dashboards |
| repoHeadBefore | SHA before apply (audit trail) |
| repoHeadAfter | SHA after commit |
