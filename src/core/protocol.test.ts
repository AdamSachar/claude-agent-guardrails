import { describe, it, expect } from "vitest";
import {
  parseHookInput,
  bashCommand,
  writeContent,
  preToolDeny,
  preToolAsk,
  preToolContext,
  systemWarning,
} from "./protocol.js";

describe("parseHookInput", () => {
  it("parses valid JSON", () => {
    const i = parseHookInput('{"tool_name":"Bash","tool_input":{"command":"ls"}}');
    expect(i.tool_name).toBe("Bash");
  });

  it("returns {} on empty or malformed input", () => {
    expect(parseHookInput("")).toEqual({});
    expect(parseHookInput("not json")).toEqual({});
    expect(parseHookInput("123")).toEqual({}); // non-object JSON
  });
});

describe("accessors", () => {
  it("reads the bash command", () => {
    expect(bashCommand({ tool_input: { command: "echo hi" } })).toBe("echo hi");
    expect(bashCommand({})).toBe("");
  });

  it("reads write content from content or new_string", () => {
    expect(writeContent({ tool_input: { content: "a" } })).toBe("a");
    expect(writeContent({ tool_input: { new_string: "b" } })).toBe("b");
    expect(writeContent({})).toBe("");
  });
});

describe("output builders", () => {
  it("builds a PreToolUse deny", () => {
    expect(preToolDeny("nope")).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "nope",
      },
    });
  });

  it("builds ask, context, and system-warning shapes", () => {
    expect(preToolAsk("?").hookSpecificOutput?.permissionDecision).toBe("ask");
    expect(preToolContext("ctx").hookSpecificOutput?.additionalContext).toBe("ctx");
    expect(systemWarning("warn").systemMessage).toBe("warn");
  });
});
