/**
 * Claude Code hook I/O protocol.
 *
 * Hooks receive a JSON object on STDIN and control flow via exit code + JSON on
 * STDOUT. The preferred mechanism is `exit 0` with a JSON decision (NOT exit 2).
 * See: https://code.claude.com/docs/en/hooks
 *
 * This module holds the types + the small set of output builders the hooks use,
 * kept pure so the parsing/shape logic is unit-testable without real stdin.
 */

export type HookEventName =
  | "PreToolUse"
  | "PostToolUse"
  | "UserPromptSubmit"
  | "Stop"
  | "SessionStart"
  | (string & {});

export interface HookInput {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  hook_event_name?: HookEventName;
  permission_mode?: string;
  tool_name?: string;
  tool_input?: {
    command?: string;
    file_path?: string;
    content?: string;
    new_string?: string;
    [k: string]: unknown;
  };
  tool_response?: unknown;
  prompt?: string;
}

export type PermissionDecision = "allow" | "deny" | "ask";

export interface HookOutput {
  continue?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
  systemMessage?: string;
  decision?: "block";
  reason?: string;
  hookSpecificOutput?: {
    hookEventName: HookEventName;
    permissionDecision?: PermissionDecision;
    permissionDecisionReason?: string;
    additionalContext?: string;
  };
}

/** Parse raw stdin text into a HookInput. Never throws - returns {} on bad input. */
export function parseHookInput(raw: string): HookInput {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as HookInput) : {};
  } catch {
    return {};
  }
}

/** Get the Bash command string from a tool-event input (empty string if absent). */
export function bashCommand(input: HookInput): string {
  return input.tool_input?.command ?? "";
}

/** Get the content being written by a Write/Edit tool call. */
export function writeContent(input: HookInput): string {
  return input.tool_input?.content ?? input.tool_input?.new_string ?? "";
}

// --- Output builders ---------------------------------------------------------

export function preToolDeny(reason: string): HookOutput {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  };
}

export function preToolAsk(reason: string): HookOutput {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: reason,
    },
  };
}

export function preToolContext(additionalContext: string): HookOutput {
  return {
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext },
  };
}

export function eventContext(event: HookEventName, additionalContext: string): HookOutput {
  return {
    hookSpecificOutput: { hookEventName: event, additionalContext },
  };
}

export function systemWarning(message: string): HookOutput {
  return { systemMessage: message };
}

// --- Runtime helpers (thin, not unit-tested) --------------------------------

/** Read all of stdin with a timeout. Resolves to {} if nothing/garbage arrives. */
export async function readHookInput(timeoutMs = 3000): Promise<HookInput> {
  return new Promise((resolve) => {
    let raw = "";
    const done = (): void => resolve(parseHookInput(raw));
    const timer = setTimeout(done, timeoutMs);
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      clearTimeout(timer);
      done();
    });
    process.stdin.on("error", () => {
      clearTimeout(timer);
      done();
    });
  });
}

/** Emit an optional JSON decision and exit 0 (the sanctioned control path). */
export function emit(output: HookOutput | null): never {
  if (output) process.stdout.write(JSON.stringify(output));
  process.exit(0);
}
