import { describe, it, expect } from "vitest";
import { shouldAttachInstructionReceipt, formatInstructionReceipt } from "./instructions.js";

describe("instruction receipt", () => {
  it("matches implementation prompts", () => {
    expect(
      shouldAttachInstructionReceipt("build the feature", {
        enabled: true,
        promptPatterns: ["\\bbuild\\b"],
      }),
    ).toBe(true);
  });

  it("respects disabled config and bad regex", () => {
    expect(
      shouldAttachInstructionReceipt("build the feature", {
        enabled: false,
        promptPatterns: ["\\bbuild\\b"],
      }),
    ).toBe(false);
    expect(
      shouldAttachInstructionReceipt("build the feature", {
        enabled: true,
        promptPatterns: ["["],
      }),
    ).toBe(false);
  });

  it("formats a compact receipt", () => {
    expect(formatInstructionReceipt(["CLAUDE.md", "AGENTS.md"])).toContain("CLAUDE.md");
    expect(formatInstructionReceipt([])).toBeNull();
  });
});
