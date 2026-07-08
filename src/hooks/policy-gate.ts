#!/usr/bin/env node
/**
 * policy-gate - PreToolUse(Bash). Denies destructive / secret-exfil commands
 * and asks for confirmation on sensitive ones. Config-driven deny/ask patterns.
 */
import {
  readHookInput,
  bashCommand,
  emit,
  preToolDeny,
  preToolAsk,
} from "../core/protocol.js";
import { loadConfig, guardrailsDisabled } from "../core/config.js";
import { evaluateCommand } from "../core/policy.js";

const input = await readHookInput();
if (guardrailsDisabled() || input.tool_name !== "Bash") emit(null);

const cfg = loadConfig(input.cwd ?? process.cwd());
const verdict = evaluateCommand(bashCommand(input), cfg.policy);

if (verdict.decision === "deny") emit(preToolDeny(verdict.reason));
if (verdict.decision === "ask") emit(preToolAsk(verdict.reason));

emit(null);
