"use client";

import { useEffect } from "react";
import { cn } from "@/components/demo/cn";
import {
  DemoScriptBlocks,
  DemoScriptSectionTitle,
} from "@/components/demo/demoScriptRendering";
import {
  INVESTOR_LIVE_SCRIPT_SECTIONS,
  INVESTOR_SLIDE_SCRIPTS,
  INVESTOR_TRANSITION_SCRIPT,
} from "@/components/demo/investorDemoSpeakerNotes";

export type DemoSpeakerNotesPhase = "slides" | "transition" | "live";

/** Matches `slideNavClassName` inset on `InvestorPitchSlides` (split column width). */
export const DEMO_NOTES_COLUMN_CLASS = "w-[min(420px,40vw)]" as const;

function useNotesModel(phase: DemoSpeakerNotesPhase, slideIndex: number) {
  const safeSlide = Math.min(
    Math.max(slideIndex, 0),
    INVESTOR_SLIDE_SCRIPTS.length - 1,
  );
  const slideScript = INVESTOR_SLIDE_SCRIPTS[safeSlide];

  let phaseLabel: string;
  if (phase === "slides") {
    phaseLabel = `Slides · ${safeSlide + 1} / ${INVESTOR_SLIDE_SCRIPTS.length}`;
  } else if (phase === "transition") {
    phaseLabel = "Transition";
  } else {
    phaseLabel = "Live proof";
  }

  return { safeSlide, slideScript, phaseLabel };
}

function NotesScrollBody({
  phase,
  slideScript,
}: {
  phase: DemoSpeakerNotesPhase;
  slideScript: (typeof INVESTOR_SLIDE_SCRIPTS)[number];
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-10">
      {phase === "slides" ? <DemoScriptBlocks blocks={slideScript.blocks} /> : null}

      {phase === "transition" ? (
        <DemoScriptBlocks blocks={INVESTOR_TRANSITION_SCRIPT} />
      ) : null}

      {phase === "live"
        ? INVESTOR_LIVE_SCRIPT_SECTIONS.map((sec) => (
            <div key={sec.title}>
              <DemoScriptSectionTitle>{sec.title}</DemoScriptSectionTitle>
              <DemoScriptBlocks blocks={sec.blocks} />
            </div>
          ))
        : null}
    </div>
  );
}

function NotesHeader({
  phaseLabel,
  slideLabel,
  showSlideLabel,
  showClose,
  onClose,
}: {
  phaseLabel: string;
  slideLabel: string;
  showSlideLabel: boolean;
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
        {showSlideLabel ? (
          <p className="mt-0.5 text-xs text-zinc-500">{slideLabel}</p>
        ) : null}
        <p className="mt-2 text-[11px] leading-snug text-zinc-600">
          Split beside deck · Mobile: Script / <span className="text-zinc-500">N</span> ·{" "}
          <span className="text-zinc-500">Say</span> / <span className="text-zinc-500">Cue</span>
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
}: {
  phase: DemoSpeakerNotesPhase;
  slideIndex: number;
  mobileOpen: boolean;
  onMobileOpenChange: (next: boolean) => void;
}) {
  const { slideScript, phaseLabel } = useNotesModel(phase, slideIndex);

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
          slideLabel={slideScript.label}
          showSlideLabel={phase === "slides"}
          showClose
          onClose={() => onMobileOpenChange(false)}
        />
        <NotesScrollBody phase={phase} slideScript={slideScript} />
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
          slideLabel={slideScript.label}
          showSlideLabel={phase === "slides"}
          showClose={false}
        />
        <NotesScrollBody phase={phase} slideScript={slideScript} />
      </aside>
    </>
  );
}
