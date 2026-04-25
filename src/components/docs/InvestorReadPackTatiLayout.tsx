"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/components/demo/cn";
import {
  DemoScriptBlocks,
  DemoScriptSectionTitle,
} from "@/components/demo/demoScriptRendering";
import {
  INVESTOR_SLIDE_SCRIPTS,
  INVESTOR_TATI_POST_DECK_SECTIONS,
} from "@/components/demo/investorDemoSpeakerNotes";

export function InvestorReadPackTatiLayout({ children }: { children: ReactNode }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"slides" | "live">("slides");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!notesOpen) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setNotesOpen(false);
      }
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [notesOpen]);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className={cn(
          "mx-auto max-w-xl px-5 py-14 transition-[padding] duration-200 sm:px-8",
          notesOpen && "lg:pr-[min(520px,46vw)]",
        )}
      >
        {children}
      </div>

      {!notesOpen ? (
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          aria-expanded={false}
          aria-controls="tati-operator-notes"
          className="fixed bottom-6 right-6 z-[60] rounded-full border border-zinc-600 bg-zinc-900/95 px-4 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur-sm transition-all hover:border-zinc-500 hover:bg-zinc-800"
        >
          Operator notes
        </button>
      ) : null}

      <aside
        id="tati-operator-notes"
        aria-label="Operator rehearsal notes"
        className={cn(
          "fixed inset-y-0 right-0 z-[55] flex w-full flex-col border-l border-zinc-800 bg-[#0c0c0e] shadow-2xl transition-[transform,opacity] duration-200 ease-out sm:w-[min(520px,46vw)] sm:max-w-none",
          notesOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div>
            <p className="font-[family-name:var(--font-geist-mono),ui-monospace,monospace] text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Operator notes
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Left: slides (house / river) · Right: live path after handoff
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotesOpen(false)}
            className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            Esc
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex shrink-0 gap-0 border-b border-zinc-800 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab("slides")}
              className={cn(
                "flex-1 px-3 py-2.5 text-xs font-medium",
                mobileTab === "slides"
                  ? "border-b-2 border-zinc-200 text-zinc-100"
                  : "text-zinc-500",
              )}
            >
              Slides (pre-live)
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("live")}
              className={cn(
                "flex-1 px-3 py-2.5 text-xs font-medium",
                mobileTab === "live"
                  ? "border-b-2 border-zinc-200 text-zinc-100"
                  : "text-zinc-500",
              )}
            >
              Live (Jarvis + demo)
            </button>
          </div>

          <div
            className={cn(
              "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain border-zinc-800 px-4 py-4 pb-16 lg:border-r",
              mobileTab === "slides" ? "flex" : "hidden",
              "lg:flex",
            )}
          >
            <div className="space-y-8">
              {INVESTOR_SLIDE_SCRIPTS.map((slide) => (
                <div key={slide.label}>
                  <DemoScriptSectionTitle>Slide · {slide.label}</DemoScriptSectionTitle>
                  <DemoScriptBlocks blocks={slide.blocks} />
                </div>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-16",
              mobileTab === "live" ? "flex" : "hidden",
              "lg:flex",
            )}
          >
            <div>
              {INVESTOR_TATI_POST_DECK_SECTIONS.map((sec) => (
                <div key={sec.title}>
                  <DemoScriptSectionTitle>{sec.title}</DemoScriptSectionTitle>
                  <DemoScriptBlocks blocks={sec.blocks} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
