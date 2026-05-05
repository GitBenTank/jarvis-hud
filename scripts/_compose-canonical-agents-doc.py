#!/usr/bin/env python3
"""One-off assembler for docs/strategy/jarvis-agent-teams-canonical-v1.md (run from repo root)."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
STRATEGY = ROOT / "docs" / "strategy"


def strip_fm(s: str) -> str:
    if s.startswith("---"):
        i = s.find("\n---", 3)
        if i != -1:
            return s[i + 4 :].lstrip("\n")
    return s


CANON_FRONT = '''---
title: "Jarvis HUD — Agents & teams (canonical v1)"
status: living-document
category: strategy
owner: Ben Tankersley
supersedes:
  - ./agent-team-v1.md
  - ./agent-team-contract-v1.md
  - ./flagship-team-bundle-v1.md
  - ./runtime-openclaw-jarvis-team-loop-v1.md
  - ./research-agent-v1.md
  - ./creative-agent-v1.md
related:
  - ../decisions/0001-thesis-lock.md
  - ../decisions/0005-agent-team-batch-v0-per-item-execute.md
  - ../architecture/jarvis-openclaw-system-overview.md
  - ../architecture/openclaw-proposal-identity-and-contract.md
  - ../architecture/openclaw-jarvis-trust-contract.md
  - ./research-batch-workflow-v1.md
  - ./creative-batch-workflow-v1.md
---

'''

INTRO = """# Jarvis HUD — Agents & teams (canonical v1)

This is the **single strategy document** for how **specialist agents** (OpenClaw-side) work **with** Jarvis HUD: routing, proposals, batches, demos, **Research** vs **Creative**, and the flagship **Alfred × Research × Creative** bundle.

**Operational runbooks** (still separate on purpose — rehearsal drills and friction logs): [Research batch workflow v1](./research-batch-workflow-v1.md) · [Creative batch workflow v1](./creative-batch-workflow-v1.md).

**Formal decision record** for batches: [ADR-0005: Batch v0 — per-item execute](../decisions/0005-agent-team-batch-v0-per-item-execute.md).

---

## Audience & promise

You already feel the friction: drafts are cheap — **truth and accountability before real effects ship** are hard. Jarvis HUD is the choke point between **ideas in the runtime** (OpenClaw) and **effects you can inspect, approve one by one, and prove later** — receipt and trace — not vibes.

**Where we're headed.** The flagship bundle ships today as Alfred + Research + Creative — one **workflow archetype** wired for demos and narrative. Tomorrow that evolves into **a broader catalog**: different **personalities and playbooks** (evidence-heavy, creator-heavy, mixed) snapped into **the same** runtime with **unchanged governance**. Jarvis stays the boundary; specialists become **swappable modules**, not autonomous principals.

Normative spine: [Thesis Lock](../decisions/0001-thesis-lock.md) (agents propose; humans authorize execution; approval is not execution; receipts; the model is not a trusted principal).

---

"""


TAIL = """
---

## Operational runbooks (separate drills)

Hands-on rehearsals and friction logs stay **outside** this page on purpose:

- [Research batch workflow v1](./research-batch-workflow-v1.md)
- [Creative batch workflow v1](./creative-batch-workflow-v1.md)

---

## Related (architecture & integration)

- [Jarvis ↔ OpenClaw system overview](../architecture/jarvis-openclaw-system-overview.md)
- [OpenClaw proposal identity](../architecture/openclaw-proposal-identity-and-contract.md)
- [OpenClaw/Jarvis trust contract](../architecture/openclaw-jarvis-trust-contract.md)
- [Jarvis strongman (operator brief)](./jarvis-strongman.md)

"""


def main() -> None:
    atm = strip_fm((STRATEGY / "agent-team-v1.md").read_text(encoding="utf-8"))
    atm = atm.replace(
        "# Agent team v1\n\n**Status:** Draft canonical direction  \n\n"
        "**Read first for operating law:** [Agent team contract v1]"
        "(./agent-team-contract-v1.md) — routing, handoffs, consent, and Jarvis mapping. "
        "**This page** is broader product framing; specialist behavior lives in "
        "[Research v1](./research-agent-v1.md), [Creative v1](./creative-agent-v1.md), "
        "and [Flagship team bundle v1](./flagship-team-bundle-v1.md).\n\n"
        "**Related:** [Agent team contract v1](./agent-team-contract-v1.md) · "
        "[Thesis Lock](./jarvis-hud-video-thesis.md#thesis-lock-do-not-drift) · "
        "[ADR-0001: Thesis Lock](../decisions/0001-thesis-lock.md) · "
        "[ADR-0005: Batch v0 — per-item execute]"
        "(../decisions/0005-agent-team-batch-v0-per-item-execute.md) · "
        "[Research batch workflow v1](./research-batch-workflow-v1.md) · "
        "[Creative batch workflow v1 (Phase 5)](./creative-batch-workflow-v1.md) · "
        "[Jarvis ↔ OpenClaw overview](../architecture/jarvis-openclaw-system-overview.md) · "
        "[Operating assumptions](./operating-assumptions.md)\n\n---\n\n",
        "",
    )
    atm_section = "## Multi-agent direction (strategy)\n\n" + atm.strip()

    contract_raw = strip_fm((STRATEGY / "agent-team-contract-v1.md").read_text(encoding="utf-8"))
    contract_raw = contract_raw.replace(
        "# Agent team contract v1 — Alfred, specialists, Jarvis\n\n**Purpose:**",
        "## Operating law — team contract (Alfred, specialists, Jarvis)\n\n**Purpose:**",
    )
    lines_out: list[str] = []
    for line in contract_raw.splitlines():
        if line == "## Related":
            break
        if line.startswith("## ") and not line.startswith("## Operating"):
            lines_out.append(line.replace("## ", "### ", 1))
        else:
            lines_out.append(line)
    contract = "\n".join(lines_out).rstrip()

    runtime_raw = strip_fm((STRATEGY / "runtime-openclaw-jarvis-team-loop-v1.md").read_text(encoding="utf-8"))
    runtime_raw = runtime_raw.replace(
        "# Runtime (OpenClaw) + team + Jarvis — one narrative loop v1\n\n**Purpose:**",
        "## OpenClaw runtime + Jarvis — one narrative loop\n\n**Purpose:**",
    )
    runtime_raw = runtime_raw.replace(
        "[Agent team contract v1](./agent-team-contract-v1.md)",
        "the [`team contract` section below](#operating-law--team-contract-alfred-specialists-jarvis)",
    )
    runtime_raw = runtime_raw.split("\n## Related\n", 1)[0].rstrip()

    research_raw = strip_fm((STRATEGY / "research-agent-v1.md").read_text(encoding="utf-8"))
    research_raw = research_raw.replace(
        "# Research agent v1 — evidence, options, Jarvis-native proposals\n\n",
        "## Specialist — Research (v1)\n\n",
    )
    research_raw = research_raw.replace(
        "./agent-team-contract-v1.md",
        "./jarvis-agent-teams-canonical-v1.md",
    )
    research_raw = research_raw.replace(
        "[shared team contract v1](./jarvis-agent-teams-canonical-v1.md)",
        "**[team contract](#operating-law--team-contract-alfred-specialists-jarvis)**",
    )
    research_raw = research_raw.split("\n## Related\n", 1)[0].rstrip()

    creative_raw = strip_fm((STRATEGY / "creative-agent-v1.md").read_text(encoding="utf-8"))
    creative_raw = creative_raw.replace(
        "# Creative agent v1 — messaging, variants, Jarvis-native proposals\n\n",
        "## Specialist — Creative (v1)\n\n",
    )
    creative_raw = creative_raw.replace(
        "./agent-team-contract-v1.md",
        "./jarvis-agent-teams-canonical-v1.md",
    )
    creative_raw = creative_raw.replace(
        "[shared team contract v1](./jarvis-agent-teams-canonical-v1.md)",
        "**[team contract](#operating-law--team-contract-alfred-specialists-jarvis)**",
    )
    creative_raw = creative_raw.split("\n## Related\n", 1)[0].rstrip()

    flag_raw = strip_fm((STRATEGY / "flagship-team-bundle-v1.md").read_text(encoding="utf-8"))
    flag_raw = flag_raw.replace(
        "# Flagship team bundle v1 — Alfred + Research + Creative\n\n",
        "## Flagship bundle — Alfred + Research + Creative\n\n",
    )
    flag_raw = flag_raw.replace(
        "[Agent team contract v1](./agent-team-contract-v1.md)",
        "`team contract` (above)",
    )
    flag_raw = flag_raw.replace(
        "[Contract](./agent-team-contract-v1.md)",
        "`team contract` (above)",
    )
    flag_raw = flag_raw.replace(
        "[Agent team v1](./agent-team-v1.md)",
        "§ Multi-agent direction (above)",
    )
    flag_raw = flag_raw.replace(
        "[Research](./research-agent-v1.md) / [Creative](./creative-agent-v1.md)",
        "§ Specialists — Research · Creative",
    )
    flag_raw = flag_raw.replace(
        "[Jarvis kind mapping](./jarvis-agent-teams-canonical-v1.md#5-jarvis-kind-mapping-execution-truth)",
        "**team contract § 5 Jarvis kind mapping**",
    )
    flag_raw = flag_raw.split("\n## Related\n", 1)[0].rstrip()

    def demote_numeric_h2(s: str) -> str:
        return re.sub(r"^## (\d+\.)", r"### \1", s, flags=re.M)

    research_raw = demote_numeric_h2(research_raw)
    creative_raw = demote_numeric_h2(creative_raw)
    runtime_raw = demote_numeric_h2(runtime_raw)

    out_text = "".join(
        [
            CANON_FRONT,
            INTRO,
            atm_section + "\n\n---\n\n",
            runtime_raw + "\n\n---\n\n",
            contract + "\n\n---\n\n",
            research_raw + "\n\n---\n\n",
            creative_raw + "\n\n---\n\n",
            flag_raw + TAIL,
        ]
    )

    # Post-fixes before write
    out_text = (
        out_text.replace(
            "**Narrative (OpenClaw runtime ↔ team ↔ Jarvis loop):** [Runtime + team + Jarvis — one narrative loop v1]"
            "(./runtime-openclaw-jarvis-team-loop-v1.md).\n\n---\n",
            "**Narrative:** See **[§ OpenClaw runtime + Jarvis](#openclaw-runtime--jarvis--one-narrative-loop)** (above).\n\n---\n",
        )
        .replace(
            "[Flagship team bundle v1](./flagship-team-bundle-v1.md) encodes",
            "The **§ Flagship bundle** section encodes",
        )
        .replace(
            "**Normative law** on roles and handoffs: `team contract` (above).",
            "**Normative law** on roles and handoffs: [team contract](#operating-law--team-contract-alfred-specialists-jarvis) (above).",
        )
        .replace(
            "`team contract` (above) → § Multi-agent direction (above)",
            "[team contract](#operating-law--team-contract-alfred-specialists-jarvis) → § Multi-agent direction (above)",
        )
        .replace(
            "Each row is one **concrete** proposal card aligned with [Jarvis kind mapping]"
            "(./agent-team-contract-v1.md#5-jarvis-kind-mapping-execution-truth)",
            "Each row is one **concrete** proposal card aligned with **team contract § 5 (Jarvis kind mapping)**",
        )
        .replace(
            "- **v2+** — Specialist specs (e.g. [Research agent v1]"
            "(./research-agent-v1.md), [Creative agent v1](./creative-agent-v1.md)) **by reference**; do not fork the consent model per agent.",
            "- **v2+** — Specialist annexes (**§ Specialist — Research**, **§ Specialist — Creative**) by reference; do not fork the consent model per agent.",
        )
    )

    # Flagship: nested heading fix
    out_text = out_text.replace("\n## What this page is\n", "\n### What this is\n")

    while "\n---\n---\n" in out_text:
        out_text = out_text.replace("\n---\n---\n", "\n---\n")

    if "--stdout" in sys.argv:
        sys.stdout.write(out_text)
        return
    dst = STRATEGY / "jarvis-agent-teams-canonical-v1.md"
    dst.write_text(out_text, encoding="utf-8")
    print(f"wrote {dst} ({len(out_text.splitlines())} lines)")


if __name__ == "__main__":
    main()
