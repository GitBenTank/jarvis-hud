# Jarvis HUD

Agent-agnostic local control plane for approvals and dry-run execution.

## Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The CLI (if used) respects `JARVIS_HUD_BASE_URL` for the API base URL. Defaults to `http://localhost:3000` when unset.

## Filming Demo Script (5 minutes)

1. **Reset today (archive)** — Click "Reset today (archive)" in System Status. Confirm. This archives any existing demo data so you start clean.

2. **Seed example draft** — In Drafts, click "Demo: Seed Example Draft" to auto-fill channel, title, body.

3. **Create approval** — Click "Create approval". A pending approval appears in the Approvals panel.

4. **Approve** — Click "Details" on the pending item. Read the "What happens if you approve?" section. Click "Approve".

5. **Execute (dry run)** — In "Approved (ready to execute)", click "Details / Execute (dry run)". Click "Execute (dry run)".

6. **Show artifact path + open file** — After execute, the artifact path is shown with a Copy button. Copy it and open in Finder/Explorer to show the JSON file.

7. **Show action log** — Scroll to the Actions panel. You should see the content.publish entry with summary.

8. **Show archive folder** — Optionally run "Reset today (archive)" again, then show `~/jarvis/_archive/YYYY-MM-DD/` to confirm data was archived.

### Optional: reduce terminal output during filming

Set `JARVIS_LOG_POLLING=1` only when debugging. Default = no polling logs.

## Tests

```bash
# Unit tests (normalize)
pnpm test:unit

# Integration tests (dev server on :3000 required)
pnpm run test:api

# Demo loop regression (reset → draft → approve → execute → proof-path)
pnpm run demo:proof
```
