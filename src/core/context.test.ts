import { describe, it, expect } from "vitest";
import { approxTokens, contextBudgetWarning, formatContextBudgetWarning } from "./context.js";

describe("context budget", () => {
  it("approximates tokens from characters", () => {
    expect(approxTokens("abcd")).toBe(1);
    expect(approxTokens("abcde")).toBe(2);
  });

  it("returns null below thresholds", () => {
    expect(
      contextBudgetWarning("short", 100, { maxPromptChars: 1000, maxTranscriptBytes: 1000 }),
    ).toBeNull();
  });

  it("warns on large prompts and transcripts", () => {
    const warning = contextBudgetWarning("x".repeat(12), 200, {
      maxPromptChars: 10,
      maxTranscriptBytes: 100,
    });
    expect(warning?.reasons).toHaveLength(2);
    expect(formatContextBudgetWarning(warning!)).toContain("context warning");
  });
});
