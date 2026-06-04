#!/usr/bin/env node
/**
 * cost-velocity — PostToolUse(*). Reads a JSONL spend ledger and warns (does
 * NOT block) when the last hour's burn-rate would exhaust the daily budget too
 * fast. Append entries to the ledger as {"ts": <ms>, "cost_usd": <n>}.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readHookInput, emit, systemWarning } from "../core/protocol.js";
import { loadConfig, guardrailsDisabled } from "../core/config.js";
import { parseLedger, velocityAlarm } from "../core/cost.js";

const input = await readHookInput();
if (guardrailsDisabled()) emit(null);

const cwd = input.cwd ?? process.cwd();
const cfg = loadConfig(cwd);
const ledgerPath = resolve(cwd, cfg.cost.ledgerPath);
if (!existsSync(ledgerPath)) emit(null);

const entries = parseLedger(readFileSync(ledgerPath, "utf8"));
const alarm = velocityAlarm(entries, Date.now(), {
  dailyBudgetUSD: cfg.cost.dailyBudgetUSD,
  maxPerHourPctOfDaily: cfg.cost.maxPerHourPctOfDaily,
});

if (alarm) {
  emit(
    systemWarning(
      `🚨 Cost-velocity alarm: $${alarm.windowSpendUSD.toFixed(2)} spent in the last hour ` +
        `(${alarm.ratio}x the $${alarm.thresholdUSD.toFixed(2)}/h threshold). ` +
        `Pause autonomous loops and investigate runaway dispatches.`,
    ),
  );
}

emit(null);
