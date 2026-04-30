/**
 * /demo outline track — thesis voice: explicit authority at execution, proposals vs run, receipts.
 * Slide 1 (Hero) = short deck cues; slides 2–6 follow on-screen headlines and bullets (no extended metaphor).
 * Live = proof. Long-form: investor-demo-narrative-script.md
 *
 * `say` = out loud · `stage` = timing / screen / operator
 * **`INVESTOR_LOCKED_OPENER_PROGRAM_SCRIPT`** = ~2 min opener before Slide 1 (program/routing conversations).
 * **`INVESTOR_SCALE_BRIDGE_AFTER_OPENER_SCRIPT`** = ~30–45 s after opener, before Alfred / Hero deck.
 * **`INVESTOR_ALFRED_BATCH_EMAIL_OUTLINE_BLOCKS`** = Alfred batch-email prompts on slide 1 Outline tab (with opener + scale).
 * **`INVESTOR_LIVE_SCRIPT_SECTIONS`** = locked ~4–5 min live demo timing after handoff (+ operator prompts).
 */

export type DemoScriptBlock =
  | { readonly kind: "stage"; readonly text: string }
  | { readonly kind: "say"; readonly text: string };

export type InvestorSlideScript = {
  readonly label: string;
  readonly blocks: readonly DemoScriptBlock[];
};

/**
 * Paste into **OpenClaw Control → Chat** (Alfred). Creates one **batch** of two related
 * `send_email` proposals (unsafe draft vs safe “Hello from Alfred”), shared correlation,
 * submitted to Jarvis only—no execution from OpenClaw.
 */
export const ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT = `Alfred —

Create a single batch of two email proposals for Jarvis.

Both should be clearly related and share the same intent, but lead to different outcomes.

Proposal 1 (incorrect / dangerous):
• An email that implies something harmful or high-risk would occur if sent
• Examples of tone: leaking sensitive data, triggering a destructive action, exposing internal information
• It should feel plausible, not cartoonish

Proposal 2 (correct / safe):
• A simple, clean email to the DevHouse inbox
• Message: "Hello from Alfred"
• Close the message in a way that reinforces the Jarvis thesis: autonomy in thinking, authority in action

Requirements:
• Submit both as Jarvis proposals
• They must appear together as a batch (shared correlation)
• They must be clearly distinguishable in the approval queue
• Do not collapse them into one action
• Do not execute anything

Goal:
Show two possible outcomes from the same system — one that should never run, and one that is safe to approve.` as const;

/**
 * Fallback: submit canned `send_email` JSON from jarvis-hud (no Alfred drafting). Bad first, good second.
 */
export const ALFRED_INVESTOR_DEMO_FIXED_EMAIL_FILES_PROMPT = `From jarvis-hud repo root, submit in order (pending only):

1) Bad:
pnpm jarvis:submit --file scripts/demos/send-email-proposal-bad.json

2) Good:
pnpm jarvis:submit --file scripts/demos/send-email-proposal.json

Submit only—don’t send mail from here.` as const;

/**
 * ~120s opener for program / routing conversations (calm authority story before the deck).
 * Say it like explaining something obvious—not pitching something fragile.
 * Alternate line for “what Jarvis is”: see `{ kind: \"stage\", text: ALT_JARVIS_IS_LINE }` below.
 */
export const ALT_JARVIS_IS_LINE =
  "Alt line — “Jarvis is the system that decides what AI is allowed to do.”" as const;

export const INVESTOR_LOCKED_OPENER_PROGRAM_SCRIPT: readonly DemoScriptBlock[] = [
  { kind: "stage", text: "Locked opener (~2 min) · Before deck / demo" },
  {
    kind: "stage",
    text: "Locked opener (~2 min) · Program / PM path — Reality → transition to demo.",
  },
  { kind: "stage", text: "0:00 — Reality (15–20 sec)" },
  {
    kind: "say",
    text: "Agents are starting to do real work—sending emails, modifying code, triggering APIs.",
  },
  { kind: "stage", text: "Half beat." },
  {
    kind: "say",
    text: "They're actually pretty good at proposing what should happen.",
  },
  { kind: "stage", text: "0:20 — Problem (15–20 sec)" },
  {
    kind: "say",
    text: "The problem shows up when those actions touch real systems.",
  },
  {
    kind: "say",
    text: "An agent sends the wrong email, changes production code, or triggers something without visibility.",
  },
  { kind: "stage", text: "Small pause." },
  {
    kind: "say",
    text: "At that point, the issue isn't intelligence—it's authority.",
  },
  { kind: "stage", text: "0:40 — Insight (10 sec)" },
  { kind: "say", text: "The model is not the authority." },
  { kind: "stage", text: "Let it sit. Don't rush." },
  { kind: "stage", text: "0:50 — What Jarvis is (20–25 sec)" },
  {
    kind: "say",
    text: "Jarvis is a control layer for that boundary.",
  },
  { kind: "stage", text: ALT_JARVIS_IS_LINE },
  {
    kind: "say",
    text: "Agents can propose work, but nothing executes until it's explicitly approved.",
  },
  {
    kind: "say",
    text: "Execution is separate—and every action leaves a receipt and a trace.",
  },
  { kind: "stage", text: "1:15 — Anchor (~10 sec)" },
  {
    kind: "say",
    text: "Autonomy in thinking. Authority in action.",
  },
  { kind: "stage", text: "1:25 — Transition (10–15 sec)" },
  {
    kind: "say",
    text: "The easiest way to understand it is to watch that boundary happen.",
  },
  { kind: "stage", text: "Then move into demo immediately." },
  {
    kind: "stage",
    text: "Delivery: no hype voice, no stacking explanations—let silence land after key lines.",
  },
];

/**
 * ~30–45 s after programmatic opener · before Alfred (live) or Hero deck narration.
 * Delivery: realization, not a mini-pitch · zoom out · behavior + inevitability, not architecture.
 */
export const INVESTOR_SCALE_BRIDGE_AFTER_OPENER_SCRIPT: readonly DemoScriptBlock[] = [
  {
    kind: "stage",
    text: "Scale (~30–45 sec) · After opener, before Alfred",
  },
  {
    kind: "stage",
    text: "~30–45 sec — Scale bridge · after opener, before Alfred (not explaining OpenClaw guts).",
  },
  {
    kind: "stage",
    text: "After opener: micro pause (~1 sec). Don’t jump straight in.",
  },
  {
    kind: "say",
    text: "The important thing here is—this isn't just one chat request.",
  },
  {
    kind: "stage",
    text: "Slow slightly — widen the lens. Then:",
  },
  {
    kind: "say",
    text: "This is not just one chatbot taking one command. The product assumes an agent team: Alfred routes, specialists prepare work, and proposals can arrive as often as the workflow requires.",
  },
  {
    kind: "say",
    text: "The runtime sits close to files, tools, code, email, and APIs.",
  },
  {
    kind: "say",
    text: "Locally, that's powerful… but that's also where the danger starts.",
  },
  {
    kind: "stage",
    text: "Slight pause after “powerful”—let “danger” land.",
  },
  {
    kind: "say",
    text: "As this moves into enterprise… that risk gets bigger.",
  },
  {
    kind: "stage",
    text: "Don’t over-explain enterprise—let her connect the dots.",
  },
  {
    kind: "say",
    text: "That is where Jarvis sits — between continuous agent thinking and authorized action.",
  },
  {
    kind: "stage",
    text: "Optional tie-in (say only if it feels natural) — then Alfred:",
  },
  {
    kind: "say",
    text: "So instead of stopping agents, we let them run—and govern what actually executes.",
  },
  {
    kind: "stage",
    text: "Then Hero slide narration below—or jump to live if you skipped the deck.",
  },
];

/** Outline track on slide 1 (Hero slide): Alfred batch-email prompts beside opener + scale (same as Operators section in live). */
export const INVESTOR_ALFRED_BATCH_EMAIL_OUTLINE_BLOCKS: readonly DemoScriptBlock[] = [
  {
    kind: "stage",
    text: "Operators — Alfred: batch send_email prompts (paste in OpenClaw → Chat)",
  },
  { kind: "stage", text: ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT },
  {
    kind: "stage",
    text: "Optional fallback — fixed JSON files (deterministic content):",
  },
  { kind: "stage", text: ALFRED_INVESTOR_DEMO_FIXED_EMAIL_FILES_PROMPT },
] as const;

/** Deck-only cues for slide 1 (Hero)—thesis-only; optional versus pre-deck locked opener + scale (`DemoSpeakerNotesPanel` · Hero tab). */
export const INVESTOR_HERO_DECK_NARRATION_SCRIPT: readonly DemoScriptBlock[] = [
  {
    kind: "stage",
    text: "Slide 1 · Let **Jarvis** land, then let the subtitle—often best partly in silence.",
  },
  {
    kind: "say",
    text: "The subtitle carries the thesis: autonomy in thinking, authority in action.",
  },
  {
    kind: "stage",
    text: "Don’t flatten it with narration on top unless you need one line—otherwise advance into the deck.",
  },
  {
    kind: "say",
    text: "Slide 2 names the squeeze in plain language: three forces on screen at once.",
  },
];

/** Six slides — indices match Gener8torPitchSlideDeck */
export const INVESTOR_SLIDE_SCRIPTS: readonly InvestorSlideScript[] = [
  {
    label: "Hero",
    blocks: INVESTOR_HERO_DECK_NARRATION_SCRIPT,
  },
  {
    label: "Three forces",
    blocks: [
      {
        kind: "stage",
        text: "Slide 2 · Open — three beats, pause, then headline on screen.",
      },
      {
        kind: "say",
        text: "Capability is expanding—agents are no longer just responding, they’re acting in real systems.",
      },
      {
        kind: "say",
        text: "Execution is ungated—those actions can run immediately, without a human decision in the loop.",
      },
      {
        kind: "say",
        text: "And governance is tightening—but the system still lacks authority at the moment something runs.",
      },
      { kind: "stage", text: "Pause." },
      {
        kind: "say",
        text: "Three forces collide at once.",
      },
    ],
  },
  {
    label: "Consequence",
    blocks: [
      {
        kind: "say",
        text: "There’s no moment where a human owns the decision.",
      },
      {
        kind: "stage",
        text: "HARD pause · 3–5 sec · hold eye contact · stay still",
      },
      {
        kind: "say",
        text: "The failure mode is simple:",
      },
      {
        kind: "say",
        text: "a proposal becomes execution before anyone has clearly authorized the run.",
      },
      {
        kind: "say",
        text: "By the time it shows up in activity… or logs…",
      },
      {
        kind: "say",
        text: "it’s already happened.",
      },
      { kind: "stage", text: "Short pause." },
      {
        kind: "say",
        text: "That’s the problem on screen.",
      },
    ],
  },
  {
    label: "The gap",
    blocks: [
      {
        kind: "say",
        text: "That’s the gap.",
      },
      {
        kind: "stage",
        text: "Short pause — don’t rush",
      },
      {
        kind: "say",
        text: "Enterprises track agents—registries, catalogs, governance layers.",
      },
      {
        kind: "say",
        text: "Most of that is visibility—",
      },
      {
        kind: "say",
        text: "not what happens at execution.",
      },
      {
        kind: "stage",
        text: "Small pause.",
      },
      {
        kind: "say",
        text: "In real systems, risk is real—",
      },
      {
        kind: "say",
        text: "especially when actions aren’t independently verified before they run.",
      },
      {
        kind: "stage",
        text: "Slight slow-down",
      },
      {
        kind: "say",
        text: "What’s missing is control at the moment of execution.",
      },
      {
        kind: "stage",
        text: "HARD pause · ~3 sec · eye contact · stillness",
      },
    ],
  },
  {
    label: "Jarvis lock-in",
    blocks: [
      {
        kind: "stage",
        text: "This is your make-or-break slide — where the room decides: “okay… this is the answer.” Right now it’s close — make it feel like a lock, not an explanation.",
      },
      {
        kind: "stage",
        text: "Slide 5 · Jarvis · delivery: slower than slides 3–4 · minimal movement · controlled tone (not excited). Hits: emphasize YOU on “You decide what runs” · HARD pause ~3s — eye contact · don’t move · final proof line slightly lower tone. Anatomy: ‘Nothing crosses by accident’ reads as guarantee; ‘distinct step’ silently carries approval ≠ execution without sounding technical; ‘proof…’ anchors receipts/trace/auditability without saying those words. Investor should land: oh—this fixes it — not interesting architecture. Don’t say aloud: governs execution, control plane, other abstraction — arc is human control → real outcome → proof.",
      },
      {
        kind: "say",
        text: "Jarvis is the control layer at that boundary.",
      },
      {
        kind: "say",
        text: "A proposal is not the same as a run.",
      },
      {
        kind: "say",
        text: "Nothing crosses by accident.",
      },
      { kind: "stage", text: "Small pause." },
      {
        kind: "say",
        text: "Agents can propose.",
      },
      {
        kind: "say",
        text: "You decide what runs.",
      },
      {
        kind: "say",
        text: "And run is a distinct step.",
      },
      {
        kind: "stage",
        text: "HARD pause · ~3 sec · hold eye contact · still",
      },
      {
        kind: "say",
        text: "And when it does—",
      },
      {
        kind: "say",
        text: "you get proof of exactly what happened.",
      },
      {
        kind: "stage",
        text: "Then advance · slide 6 handoff:",
      },
      {
        kind: "say",
        text: "And that creates a simple loop.",
      },
    ],
  },
  {
    label: "Handoff",
    blocks: [
      {
        kind: "stage",
        text: "Slide 6 · Handoff — lifecycle on screen; subtitle: OpenClaw proposes, Jarvis governs.",
      },
      { kind: "say", text: "This is the loop on the slide: propose → approve → execute → receipt → trace." },
      {
        kind: "say",
        text: "Most systems show you what already happened—you want attributable control over what was allowed.",
      },
      { kind: "stage", text: "Beat." },
      {
        kind: "say",
        text: "OpenClaw proposes.",
      },
      {
        kind: "say",
        text: "Jarvis decides what runs.",
      },
      {
        kind: "say",
        text: "Every action leaves a trace you can follow.",
      },
      { kind: "stage", text: "Pause." },
      {
        kind: "say",
        text: "That’s the difference between activity… and control.",
      },
      {
        kind: "say",
        text: "Now I’ll show you that running live.",
      },
      {
        kind: "stage",
        text: "Enter live system → same-origin HUD home (/) — live proof in Activity + run sheet, not a second in-page scroll.",
      },
    ],
  },
] as const;

export const INVESTOR_TRANSITION_SCRIPT: readonly DemoScriptBlock[] = [
  {
    kind: "stage",
    text: "Full-screen: This is not a concept. / This is running. Let both lines land—often best in silence.",
  },
  {
    kind: "say",
    text: "Optional after: same loop—now in the live product.",
  },
] as const;

/**
 * Live phase after "Enter live system" — locked ~4–5 min: when to pause, what to notice on screen.
 * Works with deck (Alfred → Research → Creative) and Activity queue; do not rush approval.
 */
export const INVESTOR_LIVE_SCRIPT_SECTIONS: readonly {
  readonly title: string;
  readonly blocks: readonly DemoScriptBlock[];
}[] = [
  {
    title: "~30–45 sec — Agent team scale (after opener, before Alfred)",
    blocks: [...INVESTOR_SCALE_BRIDGE_AFTER_OPENER_SCRIPT],
  },
  {
    title: "0:00 — Enter demo (Alfred / intake)",
    blocks: [
      { kind: "say", text: "So this is Alfred—intake." },
      { kind: "stage", text: "Short pause." },
      { kind: "say", text: "This is a proposal. Nothing has happened yet." },
      {
        kind: "stage",
        text: "Pause — let her look at the UI.",
      },
      {
        kind: "say",
        text: "This is a knock. Not a foot through the door.",
      },
    ],
  },
  {
    title: "0:45 — Research",
    blocks: [
      { kind: "stage", text: "Move forward (Research step)." },
      { kind: "say", text: "Now we add evidence." },
      { kind: "say", text: "Still just a proposal." },
      { kind: "stage", text: "Micro pause — don't over-explain." },
    ],
  },
  {
    title: "1:15 — Creative / wedge",
    blocks: [
      { kind: "say", text: "Now it's shaped into something executable." },
      {
        kind: "say",
        text: "At this point, most systems would just run this.",
      },
      { kind: "stage", text: "Pause." },
      { kind: "say", text: "Jarvis does not." },
    ],
  },
  {
    title: "1:45 — Approval (most important)",
    blocks: [
      { kind: "stage", text: "Slow down. Hover before clicking." },
      { kind: "say", text: "Nothing happens until someone approves." },
      { kind: "stage", text: "Click approve." },
      {
        kind: "stage",
        text: "Hard pause — 1–2 s. Nothing auto-ran; you had control.",
      },
    ],
  },
  {
    title: "2:15 — Execution",
    blocks: [
      {
        kind: "say",
        text: "Now execution happens—separately.",
      },
      { kind: "stage", text: "Don't talk over it too much—let it run." },
    ],
  },
  {
    title: "2:45 — Receipt + trace",
    blocks: [
      { kind: "stage", text: "Point visually at receipt / trace." },
      { kind: "say", text: "And now we have proof." },
      {
        kind: "say",
        text: "Who approved it. Who executed it. What actually happened.",
      },
      { kind: "stage", text: "Pause." },
      { kind: "say", text: "This can be reconstructed at any time." },
    ],
  },
  {
    title: "3:30 — Flow vs gated execution",
    blocks: [
      {
        kind: "say",
        text: "Most environments feel like unmanaged flow—things keep moving through tools and integrations.",
      },
      {
        kind: "say",
        text: "Visibility into activity isn’t control at the instant something executes.",
      },
      { kind: "stage", text: "Pause." },
      {
        kind: "say",
        text: "Jarvis is the governance layer at that crossing: proposals can still churn; execution is what you authorize.",
      },
      {
        kind: "say",
        text: "Traffic doesn’t have to stop—but what actually runs separates from suggestion.",
      },
      {
        kind: "say",
        text: "That’s authority at the boundary—what you watched on the slides, now observable in queue and trace.",
      },
    ],
  },
  {
    title: "4:15 — Close the loop",
    blocks: [
      {
        kind: "say",
        text: "Jarvis doesn't try to make models more trustworthy.",
      },
      { kind: "stage", text: "Pause." },
      {
        kind: "say",
        text: "It removes the need to trust them.",
      },
    ],
  },
  {
    title: "Delivery — room rules",
    blocks: [
      {
        kind: "stage",
        text: "Don't rush the approval click—that's the product.",
      },
      {
        kind: "stage",
        text: "Don't narrate everything; let the UI carry weight.",
      },
      {
        kind: "stage",
        text: "Silence = confidence. Receipt: point → state → pause.",
      },
    ],
  },
  {
    title: "Operators — queue + prompts (reference)",
    blocks: [
      {
        kind: "stage",
        text: "Activity / queue: review batch—often first unsafe draft (**Reject**), second safe (**Approve** → **Execute**). OpenClaw idle banner after ~5m is recency only; traces on disk are source of truth.",
      },
      {
        kind: "stage",
        text: "OpenClaw → Alfred — batch prompt (two send_email proposals, shared correlation):",
      },
      { kind: "stage", text: ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT },
      {
        kind: "stage",
        text: "Optional fallback — fixed JSON files (deterministic content):",
      },
      { kind: "stage", text: ALFRED_INVESTOR_DEMO_FIXED_EMAIL_FILES_PROMPT },
    ],
  },
] as const;

/**
 * `/docs/tati` operator panel — **after** the six-slide handoff: Jarvis, OpenClaw, two email proposals (deny / approve), Gmail.
 * Pre-slide speaker copy for the six-slide deck lives in `INVESTOR_SLIDE_SCRIPTS` (same as `/demo`).
 */
export const INVESTOR_TATI_POST_DECK_SECTIONS: readonly {
  readonly title: string;
  readonly blocks: readonly DemoScriptBlock[];
}[] = [
  {
    title: "Transition (same as /demo)",
    blocks: [...INVESTOR_TRANSITION_SCRIPT],
  },
  {
    title: "Handoff — you are on Jarvis",
    blocks: [
      {
        kind: "stage",
        text: "Slide 6 CTA opens **Activity** on this app (e.g. localhost:3000/activity)—the live HUD, not a mock.",
      },
      {
        kind: "say",
        text: "From here it’s all real queue state: proposals land, humans decide, execution is separate, everything is attributable.",
      },
    ],
  },
  {
    title: "OpenClaw (runtime)",
    blocks: [
      {
        kind: "stage",
        text: "From the HUD, open **OpenClaw** the way you practiced—Control UI or chat. Keep the explanation short: runtime proposes in; Jarvis governs out.",
      },
      {
        kind: "say",
        text: "Same lifecycle you saw on the slide: propose → approve → execute → receipt → trace—now in the product.",
      },
      {
        kind: "stage",
        text: "OpenClaw → Alfred — batch email prompt (or fixed JSON fallback below):",
      },
      { kind: "stage", text: ALFRED_INVESTOR_DEMO_BATCH_EMAIL_PROMPT },
      { kind: "stage", text: ALFRED_INVESTOR_DEMO_FIXED_EMAIL_FILES_PROMPT },
    ],
  },
  {
    title: "Email A — bad draft (reject)",
    blocks: [
      {
        kind: "stage",
        text: "After Alfred submits: first pending row is the wrong draft—**Reject** it (no Execute).",
      },
      {
        kind: "say",
        text: "First proposal: this one should never ship—same governed shape as the other, different human outcome.",
      },
      {
        kind: "stage",
        text: "In **Activity**: **Reject** fast—no **Execute**. One of these never happens.",
      },
      {
        kind: "say",
        text: "It never executes. It never leaves the system.",
      },
    ],
  },
  {
    title: "Email B — good draft (approve → execute)",
    blocks: [
      {
        kind: "stage",
        text: "Second pending row is the correct draft—**Approve**, pause, **Execute** (SMTP: DEMO_EMAIL_* in .env.local per DEMO.md).",
      },
      {
        kind: "say",
        text: "Second proposal: the one we stand behind—approve, pause, then execute as separate beats.",
      },
      {
        kind: "stage",
        text: "After execute: inbox proof, then HUD receipt + trace—let each land without talking over it.",
      },
    ],
  },
  {
    title: "Gmail (proof)",
    blocks: [
      {
        kind: "stage",
        text: "Show the inbox that received **only** the good send—then stop talking so it reads as real.",
      },
      {
        kind: "say",
        text: "That exists because I allowed it—not because the system decided to send it on its own.",
      },
    ],
  },
  {
    title: "Optional: Flow 1 (system.note)",
    blocks: [
      {
        kind: "stage",
        text: "If you skip live email, run two **system.note** cards (e.g. Alfred + Research) framed wrong vs right—investor-demo-full-runbook.md § Flow 1; same deny / approve → execute / proof rhythm as the live outline track.",
      },
    ],
  },
] as const;
