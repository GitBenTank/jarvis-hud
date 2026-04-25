import type { ReactNode } from "react";
import type { DemoScriptBlock } from "@/components/demo/investorDemoSpeakerNotes";

export function DemoScriptBlocks({
  blocks,
}: {
  blocks: readonly DemoScriptBlock[];
}) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.kind === "stage" ? (
          <p
            key={`stage-${i}`}
            className="border-l-2 border-zinc-700 pl-3 text-[12px] leading-relaxed text-zinc-500 whitespace-pre-wrap"
          >
            {b.text}
          </p>
        ) : (
          <p key={`say-${i}`} className="text-[14px] leading-[1.5] text-zinc-100">
            {b.text}
          </p>
        ),
      )}
    </div>
  );
}

export function DemoScriptSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-8 font-[family-name:var(--font-geist-mono),ui-monospace,monospace] text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 first:mt-0">
      {children}
    </h3>
  );
}
