import { describe, it, expect } from "vitest";
import {
  predictBashCost,
  overBudget,
  parseLedger,
  spendInWindow,
  velocityAlarm,
  type CostRule,
} from "./cost.js";

const RULES: CostRule[] = [
  { pattern: "claude\\s+-p\\b", estimatedUSD: 0.5, label: "headless dispatch" },
  {
    pattern: "--parallel(?:=|\\s+)(\\d+)",
    estimatedUSD: 0,
    perMatchGroupUSD: 0.2,
    label: "parallel fan-out",
  },
  { pattern: "[", estimatedUSD: 1, label: "invalid regex" }, // must be skipped, not throw
];

describe("predictBashCost", () => {
  it("returns 0 with no matches", () => {
    const p = predictBashCost("ls -la", RULES);
    expect(p.totalUSD).toBe(0);
    expect(p.matches).toHaveLength(0);
  });

  it("scores a flat-cost rule", () => {
    const p = predictBashCost("claude -p 'do thing'", RULES);
    expect(p.totalUSD).toBe(0.5);
    expect(p.matches[0]?.label).toBe("headless dispatch");
  });

  it("multiplies a captured group for per-worker cost", () => {
    const p = predictBashCost("run --parallel=5 agents", RULES);
    expect(p.totalUSD).toBe(1); // 5 * 0.2
  });

  it("sums multiple matching rules", () => {
    const p = predictBashCost("claude -p x && run --parallel 10", RULES);
    expect(p.totalUSD).toBe(0.5 + 2);
  });

  it("ignores invalid regex rules without throwing", () => {
    expect(() => predictBashCost("anything [", RULES)).not.toThrow();
  });
});

describe("overBudget", () => {
  it("is true only when total exceeds the cap", () => {
    expect(overBudget({ totalUSD: 3, matches: [] }, 2)).toBe(true);
    expect(overBudget({ totalUSD: 2, matches: [] }, 2)).toBe(false);
  });
});

describe("ledger + velocity", () => {
  it("parses JSONL and skips malformed lines", () => {
    const entries = parseLedger('{"ts":1,"cost_usd":0.5}\nnot json\n\n{"ts":2,"cost_usd":1}');
    expect(entries).toHaveLength(2);
  });

  it("sums only entries inside the window", () => {
    const now = 1_000_000;
    const entries = [
      { ts: now - 1000, cost_usd: 1 },
      { ts: now - 10 * 60 * 1000, cost_usd: 2 }, // 10 min ago
      { ts: now - 2 * 60 * 60 * 1000, cost_usd: 5 }, // 2h ago - excluded from 1h window
    ];
    expect(spendInWindow(entries, now, 60 * 60 * 1000)).toBe(3);
  });

  it("alarms when the hourly burn exceeds the threshold", () => {
    const now = 1_000_000;
    const entries = [{ ts: now - 1000, cost_usd: 8 }];
    const alarm = velocityAlarm(entries, now, { dailyBudgetUSD: 50, maxPerHourPctOfDaily: 10 });
    expect(alarm).not.toBeNull();
    expect(alarm?.thresholdUSD).toBe(5); // 50 * 10%
    expect(alarm?.ratio).toBeGreaterThan(1);
  });

  it("returns null when under threshold", () => {
    const now = 1_000_000;
    const entries = [{ ts: now - 1000, cost_usd: 1 }];
    expect(
      velocityAlarm(entries, now, { dailyBudgetUSD: 50, maxPerHourPctOfDaily: 10 }),
    ).toBeNull();
  });
});
