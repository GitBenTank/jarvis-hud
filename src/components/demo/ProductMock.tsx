"use client";

const mono =
  "[font-family:var(--font-demo-mono),ui-monospace,monospace]" as const;

export function ProductMock() {
  return (
    <div
      className="mt-12 w-full max-w-6xl overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/80 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-black/40 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span
          className={`${mono} text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500`}
        >
          Jarvis · execution console
        </span>
      </div>

      <div className="grid min-h-[340px] grid-cols-1 gap-0 md:grid-cols-12 md:min-h-[380px]">
        {/* Queue */}
        <div className="border-b border-white/[0.06] md:col-span-3 md:border-b-0 md:border-r md:border-white/[0.06]">
          <div
            className={`${mono} px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500`}
          >
            Approval queue
          </div>
          <ul className="px-2 pb-3 text-sm">
            <li className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2.5 text-zinc-200">
              <span
                className={`${mono} text-xs text-sky-300/90`}
              >
                send_email
              </span>
              <p className="mt-1 text-[11px] text-zinc-500">Pending approval</p>
            </li>
            <li className="mt-2 rounded-lg border border-transparent px-3 py-2.5 text-zinc-500">
              <span className={`${mono} text-xs`}>code.apply</span>
              <p className="mt-1 text-[11px] text-zinc-600">Queued</p>
            </li>
          </ul>
        </div>

        {/* Detail */}
        <div className="border-b border-white/[0.06] md:col-span-5 md:border-b-0 md:border-r md:border-white/[0.06]">
          <div
            className={`${mono} px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500`}
          >
            Selected action
          </div>
          <div className="px-4 pb-4 pt-1">
            <h3 className={`${mono} text-sm text-zinc-100`}>
              send_email
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Outbound message to verified recipient · template v3
            </p>
            <dl
              className={`${mono} mt-4 space-y-2 text-[11px]`}
            >
              <div className="flex justify-between gap-4 border-t border-white/[0.05] pt-3">
                <dt className="text-zinc-600">traceId</dt>
                <dd className="truncate text-sky-300/90">tr_8f2a9c1e4b7d</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Approved by</dt>
                <dd className="text-zinc-300">you@org.local</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Execution status</dt>
                <dd className="text-emerald-400/90">Completed</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Approved at</dt>
                <dd className="text-zinc-400">2026-04-18T14:22:09Z</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Finished at</dt>
                <dd className="text-zinc-400">2026-04-18T14:22:11Z</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Receipt + trace */}
        <div className="md:col-span-4">
          <div
            className={`${mono} px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500`}
          >
            Receipt · trace
          </div>
          <div className="px-4 pb-4 pt-1">
            <pre
              className={`${mono} max-h-[220px] overflow-auto rounded-lg border border-white/[0.06] bg-black/50 p-3 text-[10px] leading-relaxed text-zinc-400`}
            >
              {`{
  "traceId": "tr_8f2a9c1e4b7d",
  "action": "send_email",
  "proposal": "prop_3m9k",
  "approval": {
    "actor": "you@org.local",
    "decision": "allow",
    "ts": "2026-04-18T14:22:09Z"
  },
  "execution": {
    "status": "ok",
    "ts": "2026-04-18T14:22:11Z"
  },
  "artifactRef": "art_mail_02"
}`}
            </pre>
            <p className="mt-3 text-[11px] text-zinc-600">
              Full timeline reconstructable from proposal through receipt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
