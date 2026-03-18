"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

type ActivityEvent = {
  traceId: string;
  timestamp: string;
  actor: string;
  type: string;
  status: string;
  approvalId?: string;
  kind?: string;
};

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 180, height: 50 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 25,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function getEventLabel(e: ActivityEvent): string {
  if (e.type === "proposal_created") return `${e.actor} proposes`;
  if (e.type === "proposal_approved") return "Human approves";
  if (e.type === "execution_completed") return "Execution";
  if (e.type === "receipt_created") return "Receipt";
  return e.type;
}

function eventsToFlow(
  events: ActivityEvent[],
  opts?: { maxIndex?: number; highlightNodeId?: string }
): { nodes: Node[]; edges: Edge[] } {
  if (events.length === 0) {
    return {
      nodes: [
        {
          id: "empty",
          type: "default",
          position: { x: 0, y: 0 },
          data: { label: "No activity yet" },
        },
      ],
      edges: [],
    };
  }

  const maxIndex =
    typeof opts?.maxIndex === "number"
      ? Math.max(0, Math.min(opts.maxIndex, events.length - 1))
      : events.length - 1;

  const slice = events.slice(0, maxIndex + 1);

  const seen = new Set<string>();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i < slice.length; i++) {
    const e = slice[i];
    const id = `${e.traceId}-${e.type}-${e.timestamp}-${i}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const label = getEventLabel(e);
    const suffix = e.kind ? ` (${e.kind})` : "";
    const isHighlight = opts?.highlightNodeId === id;

    nodes.push({
      id,
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: `${label}${suffix}`, event: e },
      style: isHighlight
        ? {
            border: "2px solid #f59e0b",
            boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.25)",
            borderRadius: 10,
          }
        : { borderRadius: 10 },
    });

    if (i > 0) {
      const prev = slice[i - 1];
      const prevId = `${prev.traceId}-${prev.type}-${prev.timestamp}-${i - 1}`;

      if (seen.has(prevId) && prev.traceId === e.traceId) {
        edges.push({
          id: `${prevId}-${id}`,
          source: prevId,
          target: id,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: isHighlight,
        });
      }
    }
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    nodes,
    edges
  );

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

export default function ActivityGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([]);
  const [mode, setMode] = useState<"live" | "replay">("live");
  const [selectedTraceId, setSelectedTraceId] = useState<string>("");
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(650);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);

  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onNodeClick = useCallback(
    (_event: unknown, node: Node) => {
      const event = (node.data as { event?: ActivityEvent }).event;
      setSelectedEvent(event ?? null);
    },
    []
  );

  const onPaneClick = useCallback(() => setSelectedEvent(null), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEvent(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const fetchStream = useCallback(async () => {
    try {
      const res = await fetch("/api/activity/stream");
      const events: ActivityEvent[] = await res.json();
      setAllEvents(events);

      // Keep existing behavior in default live mode.
      if (mode === "live") {
        const { nodes: n, edges: e } = eventsToFlow(events);
        setNodes(n);
        setEdges(e);
      }

      // Initialize trace selection for replay mode.
      if (!selectedTraceId) {
        const firstTrace = events[0]?.traceId ?? "";
        if (firstTrace) setSelectedTraceId(firstTrace);
      }
    } catch {
      setNodes([
        {
          id: "error",
          type: "default",
          position: { x: 0, y: 0 },
          data: { label: "Failed to load activity" },
        },
      ]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges, mode, selectedTraceId]);

  useEffect(() => {
    queueMicrotask(() => fetchStream());
    const id = setInterval(fetchStream, 5000);
    return () => clearInterval(id);
  }, [fetchStream]);

  const traceIds = useMemo(() => {
    const s = new Set<string>();
    for (const e of allEvents) s.add(e.traceId);
    return Array.from(s);
  }, [allEvents]);

  const replayEvents = useMemo(() => {
    if (!selectedTraceId) return [] as ActivityEvent[];
    return allEvents
      .filter((e) => e.traceId === selectedTraceId)
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [allEvents, selectedTraceId]);

  const currentHighlightNodeId = useMemo(() => {
    if (mode !== "replay") return undefined;
    if (replayEvents.length === 0) return undefined;
    const i = Math.max(0, Math.min(replayIndex, replayEvents.length - 1));
    const e = replayEvents[i];
    return `${e.traceId}-${e.type}-${e.timestamp}-${i}`;
  }, [mode, replayEvents, replayIndex]);

  // Reset replay cursor when entering replay or switching trace.
  useEffect(() => {
    if (mode !== "replay") return;
    setIsPlaying(false);
    setReplayIndex(0);
  }, [mode, selectedTraceId]);

  // Auto-select current event while replay is playing.
  useEffect(() => {
    if (mode !== "replay" || !isPlaying || replayEvents.length === 0) return;
    const event = replayEvents[replayIndex] ?? null;
    setSelectedEvent(event);
  }, [mode, isPlaying, replayEvents, replayIndex]);

  // Build the graph from a slice in replay mode.
  useEffect(() => {
    if (mode !== "replay") return;

    const max =
      replayEvents.length === 0
        ? 0
        : Math.max(0, Math.min(replayIndex, replayEvents.length - 1));

    const { nodes: n, edges: e } = eventsToFlow(replayEvents, {
      maxIndex: max,
      highlightNodeId: currentHighlightNodeId,
    });

    setNodes(n);
    setEdges(e);
  }, [
    mode,
    replayEvents,
    replayIndex,
    currentHighlightNodeId,
    setNodes,
    setEdges,
  ]);

  useEffect(() => {
    if (mode !== "replay") return;
    if (!isPlaying) return;
    if (replayEvents.length <= 1) return;

    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    playTimerRef.current = globalThis.setTimeout(() => {
      setReplayIndex((prev) => {
        const next = prev + 1;
        if (next >= replayEvents.length) {
          setIsPlaying(false);
          return replayEvents.length - 1;
        }
        return next;
      });
    }, speedMs);

    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [mode, isPlaying, replayEvents.length, speedMs]);

  if (loading && nodes.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-zinc-500">
        Loading activity…
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 text-xs dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode((m) => (m === "live" ? "replay" : "live"))}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Mode: {mode === "live" ? "Live" : "Replay"}
          </button>

          {mode === "replay" && (
            <>
              <label htmlFor="replay-trace-select" className="ml-2 text-zinc-500 dark:text-zinc-400">
                Trace
              </label>
              <select
                id="replay-trace-select"
                value={selectedTraceId}
                onChange={(e) => setSelectedTraceId(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                {traceIds.length === 0 ? (
                  <option value="">(no traces)</option>
                ) : (
                  traceIds.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={() => setReplayIndex((i) => Math.max(0, i - 1))}
                disabled={replayEvents.length === 0 || replayIndex <= 0}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                Step ◀
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                disabled={replayEvents.length <= 1}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setReplayIndex((i) =>
                    Math.min(replayEvents.length - 1, i + 1)
                  )
                }
                disabled={
                  replayEvents.length === 0 ||
                  replayIndex >= replayEvents.length - 1
                }
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                Step ▶
              </button>

              <div className="ml-2 flex min-w-[120px] max-w-[160px] items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, replayEvents.length - 1)}
                  value={replayIndex}
                  onChange={(e) =>
                    setReplayIndex(Number(e.target.value))
                  }
                  className="h-1.5 w-full flex-1 cursor-pointer accent-amber-500"
                  aria-label="Scrub through trace"
                />
              </div>

              <label htmlFor="replay-speed-select" className="ml-2 text-zinc-500 dark:text-zinc-400">
                Speed
              </label>
              <select
                id="replay-speed-select"
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                <option value={1200}>1×</option>
                <option value={650}>2×</option>
                <option value={350}>4×</option>
                <option value={200}>6×</option>
              </select>

              <div className="ml-2 text-zinc-500 dark:text-zinc-400">
                {replayEvents.length === 0
                  ? "0/0"
                  : `${Math.min(replayIndex + 1, replayEvents.length)}/${replayEvents.length}`}
                {replayEvents.length > 0 && replayEvents[replayIndex] && (
                  <span className="ml-1 font-mono text-zinc-400 dark:text-zinc-500">
                    · {replayEvents[replayIndex].timestamp.slice(11, 19)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="text-zinc-500 dark:text-zinc-400">
          {mode === "live" ? "Polling every 5s" : "Replay is local only"}
        </div>
      </div>

      <div className="flex h-[500px] w-full">
        <div className="min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            className="rounded-b-lg"
          >
            <Background />
            <Controls />
            <MiniMap nodeColor={() => "#71717a"} />
          </ReactFlow>
        </div>

        {selectedEvent && (
          <div className="flex w-80 shrink-0 flex-col border-l border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">
              Event Details
            </div>
            <div className="space-y-1.5 font-mono text-zinc-600 dark:text-zinc-400">
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">Type:</span>{" "}
                {selectedEvent.type}
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">Actor:</span>{" "}
                {selectedEvent.actor}
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">Status:</span>{" "}
                {selectedEvent.status}
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">Trace:</span>{" "}
                <span className="truncate" title={selectedEvent.traceId}>
                  {selectedEvent.traceId.slice(0, 12)}…
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">Timestamp:</span>{" "}
                {selectedEvent.timestamp}
              </div>
              {selectedEvent.approvalId && (
                <div>
                  <span className="text-zinc-500 dark:text-zinc-500">Approval:</span>{" "}
                  <span className="truncate" title={selectedEvent.approvalId}>
                    {selectedEvent.approvalId.slice(0, 12)}…
                  </span>
                </div>
              )}
              {selectedEvent.kind && (
                <div>
                  <span className="text-zinc-500 dark:text-zinc-500">Kind:</span>{" "}
                  {selectedEvent.kind}
                </div>
              )}
            </div>
            {selectedEvent.traceId && (
              <Link
                href={`/?trace=${encodeURIComponent(selectedEvent.traceId)}`}
                className="mt-3 inline-flex items-center text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
              >
                View full trace →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
