#!/usr/bin/env node
/**
 * injection-guard - PreToolUse(Write|Edit). Scans content being written into
 * agent-context files (CLAUDE.md, .planning/, etc.) for prompt-injection
 * payloads + invisible Unicode. Advisory by default (mode: "warn"); can escalate
 * to "ask" or "deny" via guardrails.config.json.
 */
import { basename } from "node:path";
import {
  readHookInput,
  writeContent,
  emit,
  preToolDeny,
  preToolAsk,
  preToolContext,
} from "../core/protocol.js";
import { loadConfig, guardrailsDisabled } from "../core/config.js";
import { scanInjection, hasFindings, isWatchedPath } from "../core/injection.js";

const input = await readHookInput();
if (guardrailsDisabled() || (input.tool_name !== "Write" && input.tool_name !== "Edit")) {
  emit(null);
}

const cfg = loadConfig(input.cwd ?? process.cwd());
if (!cfg.injection.enabled) emit(null);

const filePath = input.tool_input?.file_path ?? "";
if (!isWatchedPath(filePath, cfg.injection.watchSubstrings)) emit(null);

const finding = scanInjection(writeContent(input));
if (!hasFindings(finding)) emit(null);

const detail = [...finding.patterns, finding.invisibleUnicode ? "invisible-unicode" : ""]
  .filter(Boolean)
  .join(", ");
const message =
  `⚠️ Possible prompt injection in ${basename(filePath)} (${detail}). This text will enter ` +
  `agent context - review it for embedded instructions before proceeding. If it's legitimate ` +
  `(e.g. docs about prompt injection), continue.`;

if (cfg.injection.mode === "deny") emit(preToolDeny(message));
if (cfg.injection.mode === "ask") emit(preToolAsk(message));
emit(preToolContext(message));
