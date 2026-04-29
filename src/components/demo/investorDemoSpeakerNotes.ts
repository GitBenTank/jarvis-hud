/**
 * /demo outline track — one voice: **house** (boundary / governance), **river** (reality / flow),
 * **door** (execution). Slide 1 sets the hook; slides 2–6 continue the same metaphor with
 * investor clarity—no tone whiplash. Live = proof. Long-form: investor-demo-narrative-script.md
 *
 * `say` = out loud · `stage` = timing / screen / operator
 * **`INVESTOR_LOCKED_OPENER_PROGRAM_SCRIPT`** = ~2 min opener before Slide 1 (program/routing conversations).
 * **`INVESTOR_SCALE_BRIDGE_AFTER_OPENER_SCRIPT`** = ~30–45 s after opener, before Alfred / Hero deck.
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
];

/** Six slides — indices match Gener8torPitchSlideDeck */
export const INVESTOR_SLIDE_SCRIPTS: readonly InvestorSlideScript[] = [
  {
    label: "Hero",
    blocks: [
      {
        kind: "stage",
        text: "Slide 1 · Let the title and subtitle land. Then tell the story below—don’t read the screen aloud.",
      },
      {
        kind: "say",
        text: "Imagine you have a house that’s become incredibly capable.",
      },
      {
        kind: "say",
        text: "It can turn lights on and off while you’re not even in the room… send messages from your address… even move money in and out of your wallet—because it’s connected to the systems around it.",
      },
      {
        kind: "say",
        text: "At first, that feels like control.",
      },
      {
        kind: "say",
        text: "But over time… the house doesn’t just assist you—it starts acting on its own.",
      },
      { kind: "stage", text: "Pause." },
      { kind: "say", text: "The house is autonomous." },
      {
        kind: "say",
        text: "And everything it does doesn’t stay inside the house.",
      },
      {
        kind: "say",
        text: "Outside, there’s a river of information—everything flowing between your systems, your data, your tools.",
      },
      {
        kind: "say",
        text: "The more connected the house becomes… the wider that river gets.",
      },
      { kind: "stage", text: "Pause." },
      {
        kind: "say",
        text: "More signals. More actions. More things moving.",
      },
      {
        kind: "say",
        text: "And as that river widens… it becomes harder to see what’s actually happening—and harder to stop something once it starts moving.",
      },
      { kind: "stage", text: "Slight pause." },
      {
        kind: "say",
        text: "At some point, you’re no longer deciding what happens—you’re just watching the results come back.",
      },
      {
        kind: "say",
        text: "The system can think on its own… but there’s no clear place where you still have authority over what it does.",
      },
      {
        kind: "say",
        text: "Jarvis separates those two things: autonomy in thinking… and authority in action.",
      },
      {
        kind: "stage",
        text: "That last line should land with the subtitle on screen—then advance to slide 2.",
      },
    ],
  },
  {
    label: "Three forces",
    blocks: [
      {
        kind: "stage",
        text: "Slide 2 · Three forces on screen—don’t read the bullets; continue the house story.",
      },
      { kind: "say", text: "The house is getting more capable." },
      {
        kind: "say",
        text: "It can act faster… across more systems… with more reach.",
      },
      {
        kind: "say",
        text: "And the flow around it — the signals, the inputs — that’s accelerating too.",
      },
      {
        kind: "say",
        text: "So more is happening… faster than we can follow.",
      },
      {
        kind: "say",
        text: "And control isn’t keeping up.",
      },
      { kind: "stage", text: "Pause." },
      { kind: "say", text: "That’s where things start to break." },
    ],
  },
  {
    label: "Consequence",
    blocks: [
      {
        kind: "stage",
        text: "Slide 3 · Let headline + typewriter land with short beats—don’t talk over it.",
      },
      {
        kind: "say",
        text: "There’s no moment where a human owns the decision — emphasize owns (authority, not vibes).",
      },
      {
        kind: "stage",
        text: "HARD pause · say nothing · ~3–5 sec — emails, code pushes, APIs land · freeze: hold eye contact/camera · don’t nod or refill silence.",
      },
      {
        kind: "say",
        text: "The house suggests something…",
      },
      {
        kind: "say",
        text: "And then something runs.",
      },
      {
        kind: "say",
        text: "And by the time you see it… it’s already happened.",
      },
      { kind: "stage", text: "Short pause." },
      { kind: "say", text: "That’s the problem." },
    ],
  },
  {
    label: "The gap",
    blocks: [
      {
        kind: "stage",
        text: "Slide 4 · House = governance, river = reality, door = execution.",
      },
      {
        kind: "say",
        text: "Inside the house… you’ve done everything right.",
      },
      {
        kind: "say",
        text: "You’ve added rules.",
      },
      {
        kind: "say",
        text: "You’ve added tracking.",
      },
      {
        kind: "say",
        text: "You’ve added oversight.",
      },
      { kind: "stage", text: "Beat." },
      {
        kind: "say",
        text: "But outside… the river doesn’t care about your rules.",
      },
      {
        kind: "say",
        text: "And at the moment something actually runs… there’s no one standing at the door.",
      },
      { kind: "stage", text: "Pause." },
      { kind: "say", text: "That’s the gap." },
      {
        kind: "stage",
        text: "HARD pause · say nothing · visibility vs execution — registry/dashboard fatigue should click · freeze: eye contact · don’t look down.",
      },
    ],
  },
  {
    label: "Jarvis lock-in",
    blocks: [
      {
        kind: "stage",
        text: "Slide 5 · Rule-like delivery—metaphor that maps to real behavior.",
      },
      {
        kind: "say",
        text: "Jarvis puts a door back in the house.",
      },
      {
        kind: "say",
        text: "Nothing crosses it by accident.",
      },
      { kind: "say", text: "Agents can propose." },
      {
        kind: "say",
        text: "You decide what’s allowed.",
      },
      {
        kind: "say",
        text: "And nothing runs… unless you actually run it.",
      },
      {
        kind: "stage",
        text: "HARD pause — authority moment · ~3 sec · hold still · eye contact · then proof line.",
      },
      {
        kind: "say",
        text: "And when it does—you get proof of exactly what happened.",
      },
    ],
  },
  {
    label: "Handoff",
    blocks: [
      {
        kind: "stage",
        text: "Slide 6 · Resolution of the story—then into live.",
      },
      { kind: "say", text: "This is the loop." },
      {
        kind: "say",
        text: "From idea… to action… to proof.",
      },
      {
        kind: "say",
        text: "Nothing hidden. Nothing assumed. Nothing automatic.",
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
        text: "And every action leaves a trace you can follow.",
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
    title: "3:30 — House + river",
    blocks: [
      {
        kind: "say",
        text: "Most systems today are like a river.",
      },
      {
        kind: "say",
        text: "Things are flowing… but you don't really control where it goes.",
      },
      { kind: "stage", text: "Pause." },
      {
        kind: "say",
        text: "Jarvis is the house on the river.",
      },
      {
        kind: "say",
        text: "Nothing comes in or out without going through it.",
      },
      {
        kind: "say",
        text: "It doesn't stop the river.",
      },
      {
        kind: "say",
        text: "It gives you authority over what crosses the boundary.",
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
 * Pre-slide house/river copy lives in `INVESTOR_SLIDE_SCRIPTS` (same as `/demo`).
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
