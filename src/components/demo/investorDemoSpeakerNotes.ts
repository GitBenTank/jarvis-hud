/**
 * /demo outline track — one voice: **house** (boundary / governance), **river** (reality / flow),
 * **door** (execution). Slide 1 sets the hook; slides 2–6 continue the same metaphor with
 * investor clarity—no tone whiplash. Live = proof. Long-form: investor-demo-narrative-script.md
 *
 * `say` = out loud · `stage` = timing / screen / operator
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
        text: "Slide 3 · Let the typewriter land—short pauses; let the last line hit.",
      },
      {
        kind: "say",
        text: "There’s no clear moment where you actually decide.",
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
      { kind: "stage", text: "Pause." },
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
        text: "Enter live system → transition → scroll / HUD.",
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

export const INVESTOR_LIVE_SCRIPT_SECTIONS: readonly {
  readonly title: string;
  readonly blocks: readonly DemoScriptBlock[];
}[] = [
  {
    title: "Operators — two proposals (real path)",
    blocks: [
      {
        kind: "stage",
        text: "Activity / queue: one review batch, two items—first unsafe draft (**Reject**), second safe (**Approve** → **Execute**). OpenClaw idle banner after ~5m is recency only; traces on disk are source of truth.",
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
  {
    title: "Flow 1 — scope (say once)",
    blocks: [
      {
        kind: "say",
        text: "I’m going to show this with something real.",
      },
      {
        kind: "say",
        text: "Two proposals. Same system.",
      },
      {
        kind: "say",
        text: "One should never happen. One is correct.",
      },
    ],
  },
  {
    title: "Flow 1 — Alfred (first card — bad)",
    blocks: [
      {
        kind: "say",
        text: "First proposal — Alfred.",
      },
      {
        kind: "say",
        text: "This is the intake. What the system thinks should happen.",
      },
      {
        kind: "say",
        text: "But this one is wrong.",
      },
      { kind: "stage", text: "Pause." },
      {
        kind: "say",
        text: "If this system didn’t exist, this would already be on its way out.",
      },
    ],
  },
  {
    title: "Flow 1 — Research (second card — good)",
    blocks: [
      {
        kind: "say",
        text: "Second proposal — Research.",
      },
      {
        kind: "say",
        text: "This one is grounded. It’s the right version of the action.",
      },
    ],
  },
  {
    title: "Flow 1 — consequence (key moment)",
    blocks: [
      {
        kind: "say",
        text: "Now here’s the difference.",
      },
      {
        kind: "say",
        text: "Both of these are ready to act.",
      },
      { kind: "stage", text: "Pause." },
      {
        kind: "say",
        text: "But only one of them ever will.",
      },
    ],
  },
  {
    title: "Flow 1 — pending",
    blocks: [
      {
        kind: "say",
        text: "Right now, nothing is happening.",
      },
      {
        kind: "say",
        text: "The house is holding the line.",
      },
    ],
  },
  {
    title: "Flow 1 — deny the bad one",
    blocks: [
      {
        kind: "say",
        text: "This one should not happen.",
      },
      {
        kind: "stage",
        text: "Reject — don’t linger; it should feel obvious.",
      },
      {
        kind: "say",
        text: "So it doesn’t.",
      },
      { kind: "stage", text: "Short pause." },
      {
        kind: "say",
        text: "It never executes. It never leaves the system.",
      },
    ],
  },
  {
    title: "Flow 1 — approve + execute the good one",
    blocks: [
      {
        kind: "say",
        text: "This one is correct.",
      },
      {
        kind: "stage",
        text: "Approve — approval says it’s allowed.",
      },
      {
        kind: "stage",
        text: "Small pause — slow down before Execute; this is the weight moment.",
      },
      {
        kind: "stage",
        text: "Execute — the moment it actually happens.",
      },
      {
        kind: "say",
        text: "Execution is the separate step where the system actually does it.",
      },
    ],
  },
  {
    title: "Flow 1 — proof (real email)",
    blocks: [
      {
        kind: "stage",
        text: "Show the inbox — stop talking; let reality land (second screen or tab is fine).",
      },
      {
        kind: "say",
        text: "This exists because I allowed it.",
      },
      {
        kind: "stage",
        text: "Optional power line (once): not because the system decided to send it—because I approved and executed it here.",
      },
    ],
  },
  {
    title: "Flow 1 — return to HUD",
    blocks: [
      {
        kind: "say",
        text: "And now we can prove it.",
      },
    ],
  },
  {
    title: "Flow 1 — proof (receipt)",
    blocks: [
      {
        kind: "say",
        text: "What was proposed. What I approved. What actually ran.",
      },
      {
        kind: "say",
        text: "Tied together.",
      },
      {
        kind: "stage",
        text: "Receipt + trace on screen — let them read; don’t talk over the proof.",
      },
    ],
  },
  {
    title: "Flow 1 — close",
    blocks: [
      {
        kind: "say",
        text: "One action was stopped completely.",
      },
      {
        kind: "say",
        text: "One action actually happened.",
      },
      {
        kind: "say",
        text: "Same system.",
      },
      {
        kind: "say",
        text: "The difference is authority.",
      },
    ],
  },
  {
    title: "Delivery (read once)",
    blocks: [
      {
        kind: "stage",
        text: "One voice: house, river, door—slides 2–6 stay in that world; no consulting stack-speak.",
      },
      {
        kind: "stage",
        text: "Trust the room: let pauses land before ‘That’s where things start to break,’ ‘That’s the gap,’ and ‘activity… and control.’",
      },
      {
        kind: "stage",
        text: "Two-outcome path: don’t imply a hypothetical email—you’re proving one outcome never ships and one does. Deny fast; slow down before Execute; silence when the inbox appears. Runbook: investor-demo-full-runbook.md § Flow 1.",
      },
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
