"use client";

import { useEffect, useState } from "react";
import { cn } from "@/components/demo/cn";
import {
  DemoScriptBlocks,
  DemoScriptSectionTitle,
} from "@/components/demo/demoScriptRendering";
import {
  INVESTOR_LOCKED_OPENER_PROGRAM_SCRIPT,
  INVESTOR_LIVE_SCRIPT_SECTIONS,
  INVESTOR_SLIDE_SCRIPTS,
  INVESTOR_TRANSITION_SCRIPT,
} from "@/components/demo/investorDemoSpeakerNotes";

export type DemoSpeakerNotesPhase = "slides" | "transition" | "live";

/** Matches `slideNavClassName` inset on `InvestorPitchSlides` (split column width). */
export const DEMO_NOTES_COLUMN_CLASS = "w-[min(420px,40vw)]" as const;

type NotesSubTab = "slides" | "postdeck";

function useNotesModel(
  phase: DemoSpeakerNotesPhase,
  slideIndex: number,
  opts?: { postDeckTabs: boolean; subTab: NotesSubTab },
) {
  const safeSlide = Math.min(
    Math.max(slideIndex, 0),
    INVESTOR_SLIDE_SCRIPTS.length - 1,
  );
  const slideScript = INVESTOR_SLIDE_SCRIPTS[safeSlide];
  const onPostDeck = Boolean(opts?.postDeckTabs && opts.subTab === "postdeck");

  let phaseLabel: string;
  if (onPostDeck) {
    phaseLabel = "After handoff";
  } else if (phase === "slides") {
    phaseLabel = `Slides · ${safeSlide + 1} / ${INVESTOR_SLIDE_SCRIPTS.length}`;
  } else if (phase === "transition") {
    phaseLabel = "Transition";
  } else {
    phaseLabel = "Live proof";
  }

  const secondLine: string | null = onPostDeck
    ? "OpenClaw → Activity. Same outline as in code + run sheet."
    : phase === "slides"
      ? slideScript.label
      : null;

  return { safeSlide, slideScript, phaseLabel, secondLine, onPostDeck };
}

function LiveOutlineSections() {
  return (
    <div>
      {INVESTOR_LIVE_SCRIPT_SECTIONS.map((sec) => (
        <div key={sec.title}>
          <DemoScriptSectionTitle>{sec.title}</DemoScriptSectionTitle>
          <DemoScriptBlocks blocks={sec.blocks} />
        </div>
      ))}
    </div>
  );
}

function NotesScrollBody({
  phase,
  slideIndex,
  slideScript,
  postDeckTabs,
  subTab,
}: {
  phase: DemoSpeakerNotesPhase;
  slideIndex: number;
  slideScript: (typeof INVESTOR_SLIDE_SCRIPTS)[number];
  postDeckTabs: boolean;
  subTab: NotesSubTab;
}) {
  if (postDeckTabs && subTab === "postdeck") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-10">
        <p className="mb-4 border-l-2 border-sky-500/40 pl-3 text-[12px] leading-relaxed text-zinc-500">
          After you tap <span className="text-zinc-300">Enter live system</span> you land on{" "}
          <span className="text-zinc-300">HUD home (/)</span>—then OpenClaw → Activity, proposals, email. Same
          sections as in{" "}
          <span className="text-zinc-400">INVESTOR_LIVE_SCRIPT_SECTIONS</span> in the speaker notes file.
        </p>
        <LiveOutlineSections />
      </div>
    );
  }

  const showLockedOpener = phase === "slides" && slideIndex === 0 && subTab === "slides";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-10">
      {phase === "slides" && showLockedOpener ? (
        <details open className="mb-6 rounded-lg border border-sky-500/20 bg-sky-950/20 px-3 py-2">
          <summary className="cursor-pointer list-none py-2 text-[12px] font-medium leading-snug text-sky-200/95 [&::-webkit-details-marker]:hidden">
            Locked opener (~2 min) · Before deck / demo
          </summary>
          <DemoScriptBlocks blocks={INVESTOR_LOCKED_OPENER_PROGRAM_SCRIPT} />
          <p className="mb-4 border-l-2 border-zinc-600 pl-3 text-[11px] leading-relaxed text-zinc-500">
            Then run the Hero slide narration below—or advance if you led with straight talk only.
          </p>
        </details>
      ) : null}
      {phase === "slides" ? <DemoScriptBlocks blocks={slideScript.blocks} /> : null}
      {phase === "transition" ? <DemoScriptBlocks blocks={INVESTOR_TRANSITION_SCRIPT} /> : null}
      {phase === "live" ? <LiveOutlineSections /> : null}
    </div>
  );
}

function PostDeckSubTabBar({
  subTab,
  onSubTabChange,
}: {
  subTab: NotesSubTab;
  onSubTabChange: (next: NotesSubTab) => void;
}) {
  const tab = (id: NotesSubTab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => onSubTabChange(id)}
      className={cn(
        "flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors",
        subTab === id
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex shrink-0 gap-1 border-b border-zinc-800 px-2 py-2">
      {tab("slides", "Slides")}
      {tab("postdeck", "After handoff")}
    </div>
  );
}

function NotesHeader({
  phaseLabel,
  secondLine,
  postDeckTabs,
  showClose,
  onClose,
}: {
  phaseLabel: string;
  secondLine: string | null;
  postDeckTabs: boolean;
  showClose: boolean;
  onClose?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
      <div>
        <p className="font-[family-name:var(--font-geist-mono),ui-monospace,monospace] text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Outline track
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-100">{phaseLabel}</p>
        {secondLine ? <p className="mt-0.5 text-xs text-zinc-500">{secondLine}</p> : null}
        <p className="mt-2 text-[11px] leading-snug text-zinc-600">
          Split beside deck
          {postDeckTabs ? " · tab After handoff for live script" : ""} · Mobile: Script /{" "}
          <span className="text-zinc-500">N</span> · <span className="text-zinc-500">Say</span> /{" "}
          <span className="text-zinc-500">Cue</span>
        </p>
      </div>
      {showClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Close outline track"
        >
          Esc / N
        </button>
      ) : null}
    </div>
  );
}

export function DemoSpeakerNotesPanel({
  phase,
  slideIndex,
  mobileOpen,
  onMobileOpenChange,
  postDeckTabs = false,
}: {
  phase: DemoSpeakerNotesPhase;
  slideIndex: number;
  mobileOpen: boolean;
  onMobileOpenChange: (next: boolean) => void;
  /** When true (e.g. /demo), show Slides + After handoff so live script is visible beside the deck. */
  postDeckTabs?: boolean;
}) {
  const [subTab, setSubTab] = useState<NotesSubTab>("slides");
  const { safeSlide, slideScript, phaseLabel, secondLine } = useNotesModel(
    phase,
    slideIndex,
    postDeckTabs ? { postDeckTabs, subTab } : undefined,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (globalThis.matchMedia("(min-width: 640px)").matches) return;

      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape" && mobileOpen) {
        e.preventDefault();
        onMobileOpenChange(false);
        return;
      }
      if (e.key !== "n" && e.key !== "N") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      onMobileOpenChange(!mobileOpen);
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileOpenChange]);

  return (
    <>
      <button
        type="button"
        onClick={() => onMobileOpenChange(true)}
        aria-expanded={mobileOpen}
        aria-controls="demo-speaker-notes-panel-mobile"
        className={cn(
          "fixed bottom-6 right-6 z-[25] rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-xs font-medium text-zinc-200 shadow-lg backdrop-blur-sm transition-opacity hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-50 sm:hidden",
          mobileOpen && "pointer-events-none opacity-0",
        )}
      >
        Script<span className="ml-2 text-zinc-500">N</span>
      </button>

      <aside
        id="demo-speaker-notes-panel-mobile"
        aria-label="Demo outline track"
        className={cn(
          "fixed inset-y-0 right-0 z-[45] flex sm:hidden",
          DEMO_NOTES_COLUMN_CLASS,
          "max-w-full flex-col border-l border-zinc-800 bg-[#0c0c0e]/98 shadow-2xl backdrop-blur-md transition-[transform,opacity] duration-200 ease-out",
          mobileOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-full opacity-0",
        )}
      >
        <NotesHeader
          phaseLabel={phaseLabel}
          secondLine={secondLine}
          postDeckTabs={postDeckTabs}
          showClose
          onClose={() => onMobileOpenChange(false)}
        />
        {postDeckTabs ? (
          <PostDeckSubTabBar subTab={subTab} onSubTabChange={setSubTab} />
        ) : null}
        <NotesScrollBody
          phase={phase}
          slideIndex={safeSlide}
          slideScript={slideScript}
          postDeckTabs={postDeckTabs}
          subTab={subTab}
        />
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close outline track backdrop"
          className="fixed inset-0 z-[44] bg-black/40 sm:hidden"
          onClick={() => onMobileOpenChange(false)}
        />
      ) : null}

      <aside
        id="demo-speaker-notes-panel-split"
        aria-label="Demo outline track"
        className={cn(
          "relative hidden h-full shrink-0 flex-col border-l border-zinc-800 bg-[#0c0c0e] sm:flex",
          DEMO_NOTES_COLUMN_CLASS,
        )}
      >
        <NotesHeader
          phaseLabel={phaseLabel}
          secondLine={secondLine}
          postDeckTabs={postDeckTabs}
          showClose={false}
        />
        {postDeckTabs ? (
          <PostDeckSubTabBar subTab={subTab} onSubTabChange={setSubTab} />
        ) : null}
        <NotesScrollBody
          phase={phase}
          slideIndex={safeSlide}
          slideScript={slideScript}
          postDeckTabs={postDeckTabs}
          subTab={subTab}
        />
      </aside>
    </>
  );
}
