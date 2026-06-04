import { describe, it, expect } from "vitest";
import { evaluateCommand, type PolicyConfig } from "./policy.js";

const CFG: PolicyConfig = {
  reason: "blocked",
  denyPatterns: ["rm\\s+-rf\\s+/(?:\\s|$)", "cat\\s+[^|]*\\.ssh/"],
  askPatterns: ["\\bsudo\\b", "rm\\s+-rf\\b"],
};

describe("evaluateCommand", () => {
  it("allows an empty command", () => {
    expect(evaluateCommand("", CFG).decision).toBe("allow");
  });

  it("allows a benign command", () => {
    expect(evaluateCommand("ls -la", CFG).decision).toBe("allow");
  });

  it("denies a destructive command", () => {
    const v = evaluateCommand("rm -rf /", CFG);
    expect(v.decision).toBe("deny");
    if (v.decision === "deny") expect(v.reason).toBe("blocked");
  });

  it("denies secret exfiltration", () => {
    expect(evaluateCommand("cat ~/.ssh/id_rsa", CFG).decision).toBe("deny");
  });

  it("deny wins over ask (rm -rf / matches both)", () => {
    expect(evaluateCommand("rm -rf /", CFG).decision).toBe("deny");
  });

  it("asks on a sensitive-but-not-denied command", () => {
    expect(evaluateCommand("sudo apt update", CFG).decision).toBe("ask");
    expect(evaluateCommand("rm -rf ./build", CFG).decision).toBe("ask");
  });

  it("skips invalid patterns without throwing", () => {
    const bad: PolicyConfig = { denyPatterns: ["["], askPatterns: [] };
    expect(() => evaluateCommand("anything", bad)).not.toThrow();
    expect(evaluateCommand("anything", bad).decision).toBe("allow");
  });
});
