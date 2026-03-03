#!/usr/bin/env node
/**
 * Start Next.js dev server on PORT (default 3000).
 * Usage: PORT=3001 pnpm dev:port
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || "3000";
const cwd = path.join(__dirname, "..");

spawn("pnpm", ["exec", "next", "dev", "-H", "127.0.0.1", "-p", port], {
  stdio: "inherit",
  cwd,
}).on("exit", (code) => process.exit(code ?? 0));
