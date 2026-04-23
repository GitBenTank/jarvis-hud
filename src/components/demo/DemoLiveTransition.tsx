"use client";

import { useEffect, useState } from "react";

export function DemoLiveTransition({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const r = requestAnimationFrame(() => setVisible(true));
    const t = window.setTimeout(onDone, 2200);
    return () => {
      cancelAnimationFrame(r);
      window.clearTimeout(t);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050508] px-6"
      role="status"
      aria-live="polite"
    >
      <div
        className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <p className="text-center text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl">
          This is not a concept.
        </p>
        <p className="mt-5 text-center text-2xl font-medium tracking-tight text-sky-200/95 md:text-3xl">
          This is running.
        </p>
      </div>
    </div>
  );
}
