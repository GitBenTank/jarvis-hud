# Jarvis — investor pitch deck (source)

## Files

| File | Purpose |
|------|---------|
| [jarvis-investor-deck.md](./jarvis-investor-deck.md) | [Marp](https://marp.app/) source — **10 slides**, export to PDF or PPTX |

## Export (no repo install required)

From repo root (use `--no-stdin` so the CLI does not wait for piped input):

```bash
npx --yes @marp-team/marp-cli@latest --no-stdin docs/strategy/pitch-deck/jarvis-investor-deck.md -o docs/strategy/pitch-deck/jarvis-investor-deck.pdf
```

PowerPoint:

```bash
npx --yes @marp-team/marp-cli@latest --no-stdin docs/strategy/pitch-deck/jarvis-investor-deck.md -o docs/strategy/pitch-deck/jarvis-investor-deck.pptx
```

HTML (optional):

```bash
npx --yes @marp-team/marp-cli@latest --no-stdin docs/strategy/pitch-deck/jarvis-investor-deck.md -o docs/strategy/pitch-deck/jarvis-investor-deck.html
```

A **checked-in PDF** is included for quick sharing; re-export after editing the `.md` source.

## Edit in Cursor / VS Code

Install the **Marp for VS Code** extension, open `jarvis-investor-deck.md`, use the preview pane, then export from the extension if you prefer.

## Before sending to investors

1. Replace **placeholder slides** (team, traction, ask, demo screenshot) in `jarvis-investor-deck.md`.
2. Re-export PDF (or PPTX if you want to tweak fonts in Office).
3. Keep a **Confidential** footer — already set in Marp front matter.

## Strategy context

- Narration script: [../investor-demo-narrative-script.md](../investor-demo-narrative-script.md)
- VC lens + outline: [../investor-fundraising-deck-outline.md](../investor-fundraising-deck-outline.md)
- Thesis Lock: [../jarvis-hud-video-thesis.md](../jarvis-hud-video-thesis.md)
