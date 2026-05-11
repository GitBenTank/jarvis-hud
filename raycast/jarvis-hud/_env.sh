# Shared Raycast Script Commands context (sourced by sibling scripts).
# Override repo: export JARVIS_HUD_ROOT=/path/to/jarvis-hud before Raycast runs (or edit here).
REPO_ROOT="${JARVIS_HUD_ROOT:-$HOME/Documents/jarvis-hud}"

# Raycast gets a thin, non-login shell env. Prefer known-good Node/pnpm locations first,
# otherwise it may pick a broken Homebrew node (for example node@24 linked against a
# missing simdjson dylib) and crash before any script output appears.
export PATH="/opt/homebrew/opt/node@22/bin:${HOME}/Library/pnpm:${HOME}/Library/pnpm/.tools/pnpm/10.32.1/bin:/opt/homebrew/bin:/opt/homebrew/sbin:${HOME}/.local/share/pnpm:/usr/local/bin:$PATH"
