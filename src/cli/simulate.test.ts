import { describe, it, expect } from "vitest";
import { defaultPayload, HOOK_NAMES, isHookName, usage } from "./simulate.js";

describe("simulate CLI helpers", () => {
  it("recognizes bundled hooks", () => {
    expect(HOOK_NAMES).toContain("cost-guard");
    expect(isHookName("policy-gate")).toBe(true);
    expect(isHookName("unknown")).toBe(false);
  });

  it("builds safe default payloads", () => {
    const payload = defaultPayload("context-budget", "/tmp/project") as {
      cwd: string;
      prompt: string;
    };
    expect(payload.cwd).toBe("/tmp/project");
    expect(payload.prompt.length).toBeGreaterThan(12000);
  });

  it("prints hook names in usage", () => {
    expect(usage()).toContain("instruction-receipt");
  });
});
