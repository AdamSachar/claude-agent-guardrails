#!/usr/bin/env node
/**
 * cost-guard - PreToolUse(Bash). Predicts a Bash command's cost and DENIES it
 * if it exceeds the per-dispatch budget. The headline guardrail: an autonomous
 * agent can't run away with your bill.
 */
import { readHookInput, bashCommand, emit, preToolDeny } from "../core/protocol.js";
import { loadConfig, guardrailsDisabled } from "../core/config.js";
import { predictBashCost, overBudget } from "../core/cost.js";

const input = await readHookInput();
if (guardrailsDisabled() || input.tool_name !== "Bash") emit(null);

const cfg = loadConfig(input.cwd ?? process.cwd());
const prediction = predictBashCost(bashCommand(input), cfg.cost.rules);

if (overBudget(prediction, cfg.cost.maxPerDispatchUSD)) {
  const breakdown = prediction.matches
    .map((m) => `${m.label}: $${m.costUSD.toFixed(2)}`)
    .join("; ");
  emit(
    preToolDeny(
      `Predicted cost $${prediction.totalUSD.toFixed(2)} exceeds the per-dispatch cap of ` +
        `$${cfg.cost.maxPerDispatchUSD} (${breakdown}). Reduce the scope, split it into smaller ` +
        `dispatches, or raise maxPerDispatchUSD in guardrails.config.json.`,
    ),
  );
}

emit(null);
