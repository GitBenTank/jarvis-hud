# Jarvis HUD — Raycast Script Commands

1. Install [Raycast](https://www.raycast.com/) Script Commands if you have not already.
2. Raycast → **Settings** → **Extensions** → **Script Commands** → **Script Directories** → **Add Directories**.
3. Add this folder: `raycast/jarvis-hud` inside your clone (or symlink it into `~/raycast-scripts/jarvis-hud`).
4. Optional: set `JARVIS_HUD_ROOT` in your shell profile if the repo is not at `~/Documents/jarvis-hud`.

Scripts open **Terminal.app** for long-running `pnpm` processes so Raycast does not hang. Kill, doctor, dashboard auth, and “open browsers” run inside Raycast with full output.

If Raycast reports **pnpm not found**, edit `_env.sh` and extend `PATH` (for example for `fnm`, `nvm`, or a custom pnpm location).
