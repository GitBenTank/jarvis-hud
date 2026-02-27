"use client";

import { useState } from "react";

const DEMO_SEED = {
  channel: "blog",
  title: "Day 1: The Plan",
  body: `1. Set up the project structure
2. Implement core storage layer
3. Build approvals workflow
4. Add content.publish execution (dry run)
5. Create Drafts panel
6. Add System Status summary
7. Test end-to-end flow
8. Demo on camera`,
};

const YOUTUBE_PRESET = {
  channel: "youtube",
  title: "Jarvis HUD — Runtime Boundary Layer for Agentic Execution",
  body: `Agentic AI is shifting from output assistants to action-taking systems.

When agents gain access to tools, credentials, and production environments, the dominant risk is no longer incorrect output — it is uncontrolled execution.

Jarvis HUD is an approval and control center for local agents with root access.

Agents can propose anything.
Execution requires explicit human approval.
Every action produces receipts (artifact + log).

Autonomy in thinking.
Authority in action.`,
};

const SYSTEM_NOTE_PRESET = {
  channel: "system",
  title: "Decision Log Entry",
  note: `## Context
What prompted this decision?

## Decision
What did we decide?

## Rationale
Why this path vs alternatives?

## Outcome (fill in later)
- `,
};

export default function DraftsPanel() {
  const [channel, setChannel] = useState("blog");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [videoFilePath, setVideoFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedDemo = () => {
    setChannel(DEMO_SEED.channel);
    setTitle(DEMO_SEED.title);
    setBody(DEMO_SEED.body);
    setResult(null);
    setError(null);
  };

  const handleYouTubePreset = () => {
    setChannel(YOUTUBE_PRESET.channel);
    setTitle(YOUTUBE_PRESET.title);
    setBody(YOUTUBE_PRESET.body);
    setNote("");
    setVideoFilePath("");
    setResult(null);
    setError(null);
  };

  const handleSystemNotePreset = () => {
    setChannel(SYSTEM_NOTE_PRESET.channel);
    setTitle(SYSTEM_NOTE_PRESET.title);
    setNote(SYSTEM_NOTE_PRESET.note);
    setBody("");
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const payload: Record<string, unknown> = { channel, title };
      if (channel === "system") {
        payload.note = note;
      } else {
        payload.body = body;
        if (channel === "youtube" && videoFilePath.trim()) {
          payload.youtube = { videoFilePath: videoFilePath.trim() };
        }
      }
      const res = await fetch("/api/drafts/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ id: data.id });
        setTitle("");
        setBody("");
        setNote("");
      } else {
        setError(data.error ?? "Failed to create approval");
      }
    } catch {
      setError("Failed to create approval");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-xl font-semibold">Drafts</h2>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSeedDemo}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Simulate Agent Proposal
        </button>
        <button
          type="button"
          onClick={handleYouTubePreset}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          YouTube: Jarvis HUD Thesis Video Pack
        </button>
        <button
          type="button"
          onClick={handleSystemNotePreset}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          System Note: Decision Log Entry
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              setResult(null);
              setError(null);
            }}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            <option value="blog">blog</option>
            <option value="youtube">youtube</option>
            <option value="system">system</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            placeholder={channel === "system" ? "Note title" : "Post title"}
          />
        </div>
        {channel === "youtube" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Video file path (optional)
            </label>
            <input
              type="text"
              value={videoFilePath}
              onChange={(e) => setVideoFilePath(e.target.value)}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
              placeholder="/Users/.../Exports/jarvis-hud-thesis.mp4"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {channel === "system" ? "Note" : "Body"}
          </label>
          <textarea
            value={channel === "system" ? note : body}
            onChange={(e) => (channel === "system" ? setNote(e.target.value) : setBody(e.target.value))}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            placeholder={channel === "system" ? "Markdown note..." : "Post body..."}
            rows={4}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            loading ||
            !title.trim() ||
            (channel === "system" ? !note.trim() : !body.trim())
          }
          className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit to Control Plane"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-900/30">
          <p className="font-medium">Approval created</p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            ID: {result.id}
          </p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Refresh the Approvals panel to see it.
          </p>
        </div>
      )}
    </div>
  );
}
