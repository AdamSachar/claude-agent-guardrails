import { describe, it, expect } from "vitest";
import { resolveConfig, DEFAULT_CONFIG } from "./config.js";

describe("resolveConfig", () => {
  it("returns defaults when nothing is provided", () => {
    const c = resolveConfig(null, {});
    expect(c.cost.maxPerDispatchUSD).toBe(DEFAULT_CONFIG.cost.maxPerDispatchUSD);
    expect(c.injection.mode).toBe("warn");
  });

  it("lets a file config override defaults", () => {
    const c = resolveConfig({ cost: { maxPerDispatchUSD: 10 } }, {});
    expect(c.cost.maxPerDispatchUSD).toBe(10);
    // untouched sections keep defaults
    expect(c.policy.denyPatterns).toEqual(DEFAULT_CONFIG.policy.denyPatterns);
  });

  it("lets env overrides win over file config", () => {
    const c = resolveConfig(
      { cost: { maxPerDispatchUSD: 10 } },
      { CLAUDE_GUARDRAILS_MAX_PER_DISPATCH_USD: "0.5" },
    );
    expect(c.cost.maxPerDispatchUSD).toBe(0.5);
  });

  it("ignores non-numeric env overrides", () => {
    const c = resolveConfig(null, { CLAUDE_GUARDRAILS_DAILY_BUDGET_USD: "abc" });
    expect(c.cost.dailyBudgetUSD).toBe(DEFAULT_CONFIG.cost.dailyBudgetUSD);
  });

  it("accepts a valid injection mode override and ignores invalid ones", () => {
    expect(resolveConfig(null, { CLAUDE_GUARDRAILS_INJECTION_MODE: "deny" }).injection.mode).toBe(
      "deny",
    );
    expect(resolveConfig(null, { CLAUDE_GUARDRAILS_INJECTION_MODE: "nope" }).injection.mode).toBe(
      "warn",
    );
  });

  it("merges context and instruction settings", () => {
    const c = resolveConfig(
      { context: { maxPromptChars: 50 }, instructions: { enabled: false } },
      { CLAUDE_GUARDRAILS_MAX_TRANSCRIPT_BYTES: "1234" },
    );
    expect(c.context.maxPromptChars).toBe(50);
    expect(c.context.maxTranscriptBytes).toBe(1234);
    expect(c.instructions.enabled).toBe(false);
    expect(c.instructions.instructionFiles).toEqual(DEFAULT_CONFIG.instructions.instructionFiles);
  });
});
