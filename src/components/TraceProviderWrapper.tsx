"use client";

import { Suspense, type ReactNode } from "react";
import { TraceProvider } from "@/context/TraceContext";

export default function TraceProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TraceProvider>{children}</TraceProvider>
    </Suspense>
  );
}
