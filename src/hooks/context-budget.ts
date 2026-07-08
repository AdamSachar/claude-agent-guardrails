#!/usr/bin/env node
/**
 * context-budget - UserPromptSubmit. Warns when a prompt or active transcript
 * is large enough that the next autonomous run is likely to drift.
 */
import { existsSync, statSync } from "node:fs";
import { readHookInput, emit, eventContext } from "../core/protocol.js";
import { loadConfig, guardrailsDisabled } from "../core/config.js";
import { contextBudgetWarning, formatContextBudgetWarning } from "../core/context.js";

const input = await readHookInput();
if (guardrailsDisabled() || input.hook_event_name !== "UserPromptSubmit") emit(null);

const cfg = loadConfig(input.cwd ?? process.cwd());
let transcriptBytes: number | null = null;
if (input.transcript_path && existsSync(input.transcript_path)) {
  transcriptBytes = statSync(input.transcript_path).size;
}

const warning = contextBudgetWarning(input.prompt ?? "", transcriptBytes, cfg.context);
if (!warning) emit(null);

emit(eventContext("UserPromptSubmit", formatContextBudgetWarning(warning)));
