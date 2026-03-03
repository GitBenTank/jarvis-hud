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
  youtube: {
    tags: `jarvis hud, ai control plane, agentic ai governance, ai agent approval system, openclaw ai, human in the loop ai, ai tool execution, runtime control layer, agent execution safety, ai execution boundary, builder operating system, developer ai tools, ai workflow automation, technical founder tools`,
  },
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

const CODE_DIFF_PRESET = {
  channel: "code",
  title: "Dry-run Change Bundle",
  code: {
    action: "diff" as const,
    summary: "Proposed code changes — no apply, receipts only.",
    diffText: "",
    files: [] as string[],
  },
};

const CODE_APPLY_PRESET = {
  channel: "code",
  title: "Commit Approved Diff",
  code: {
    action: "apply" as const,
    summary: "This will modify your working tree and create a local git commit. No pushing.",
    diffText: "",
    files: [] as string[],
  },
};

export default function DraftsPanel() {
  const [channel, setChannel] = useState("blog");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [videoFilePath, setVideoFilePath] = useState("");
  const [youtubeTags, setYoutubeTags] = useState("");
  const [codeAction, setCodeAction] = useState<"diff" | "apply">("diff");
  const [codeSummary, setCodeSummary] = useState("");
  const [diffText, setDiffText] = useState("");
  const [filesList, setFilesList] = useState("");
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
    setYoutubeTags(YOUTUBE_PRESET.youtube?.tags ?? "");
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

  const handleCodeDiffPreset = () => {
    setChannel(CODE_DIFF_PRESET.channel);
    setTitle(CODE_DIFF_PRESET.title);
    setCodeAction("diff");
    setCodeSummary(CODE_DIFF_PRESET.code.summary ?? "");
    setDiffText(CODE_DIFF_PRESET.code.diffText ?? "");
    setFilesList("");
    setBody("");
    setNote("");
    setResult(null);
    setError(null);
  };

  const handleCodeApplyPreset = () => {
    setChannel(CODE_APPLY_PRESET.channel);
    setTitle(CODE_APPLY_PRESET.title);
    setCodeAction("apply");
    setCodeSummary(CODE_APPLY_PRESET.code.summary ?? "");
    setDiffText(CODE_APPLY_PRESET.code.diffText ?? "");
    setFilesList("");
    setBody("");
    setNote("");
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
      } else if (channel === "code") {
        const code: Record<string, string | string[] | "diff" | "apply"> = {
          action: codeAction,
        };
        if (codeSummary.trim()) code.summary = codeSummary.trim();
        if (diffText.trim()) code.diffText = diffText.trim();
        if (filesList.trim()) {
          code.files = filesList
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
        payload.code = code;
      } else {
        payload.body = body;
        if (channel === "youtube") {
          const youtube: Record<string, string> = {};
          if (videoFilePath.trim()) youtube.videoFilePath = videoFilePath.trim();
          if (youtubeTags.trim()) youtube.tags = youtubeTags.trim();
          payload.youtube = youtube;
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
        <button
          type="button"
          onClick={handleCodeDiffPreset}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Code Diff: Dry-run Change Bundle
        </button>
        <button
          type="button"
          onClick={handleCodeApplyPreset}
          className="rounded border border-amber-400 px-3 py-1.5 text-sm hover:bg-amber-50 dark:border-amber-600 dark:hover:bg-amber-900/30"
        >
          Code Apply: Commit Approved Diff
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
            <option value="code">code</option>
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
        {channel === "code" && (
          <>
            <div>
              <label htmlFor="code-action" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Action
              </label>
              <select
                id="code-action"
                value={codeAction}
                onChange={(e) =>
                  setCodeAction(e.target.value === "apply" ? "apply" : "diff")
                }
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
              >
                <option value="diff">Diff only (dry-run, no commit)</option>
                <option value="apply">Apply + commit (modifies git repo)</option>
              </select>
              {codeAction === "apply" && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  This will modify your working tree and create a local git commit. No pushing. Requires JARVIS_REPO_ROOT.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="code-summary" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Summary (optional)
              </label>
              <input
                id="code-summary"
                type="text"
                value={codeSummary}
                onChange={(e) => setCodeSummary(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                placeholder="Overview of proposed changes"
              />
            </div>
            <div>
              <label htmlFor="code-diff" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Diff text {codeAction === "apply" ? "(required)" : "(optional)"}
              </label>
              <textarea
                id="code-diff"
                value={diffText}
                onChange={(e) => setDiffText(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                placeholder="Paste unified diff here..."
                rows={4}
              />
            </div>
            <div>
              <label htmlFor="code-files" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Files list (optional, comma or newline)
              </label>
              <input
                id="code-files"
                type="text"
                value={filesList}
                onChange={(e) => setFilesList(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                placeholder="src/file.ts, lib/utils.ts"
              />
            </div>
          </>
        )}
        {channel === "youtube" && (
          <>
            <div>
              <label htmlFor="youtube-tags" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tags (comma-separated, minimum 8)
              </label>
              <input
                id="youtube-tags"
                type="text"
                value={youtubeTags}
                onChange={(e) => setYoutubeTags(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                placeholder="jarvis hud, ai control plane, ..."
              />
            </div>
            <div>
              <label htmlFor="youtube-video" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Video file path (optional)
              </label>
              <input
                id="youtube-video"
                type="text"
                value={videoFilePath}
                onChange={(e) => setVideoFilePath(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                placeholder="/Users/.../Exports/jarvis-hud-thesis.mp4"
              />
            </div>
          </>
        )}
        {channel !== "code" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {channel === "system" ? "Note" : "Body"}
            </label>
            <textarea
              value={channel === "system" ? note : body}
              onChange={(e) =>
                channel === "system" ? setNote(e.target.value) : setBody(e.target.value)
              }
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
              placeholder={channel === "system" ? "Markdown note..." : "Post body..."}
              rows={4}
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={
            loading ||
            !title.trim() ||
            (channel === "system" ? !note.trim() : channel === "code" ? codeAction === "apply" && !diffText.trim() : !body.trim())
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
