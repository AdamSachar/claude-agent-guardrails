/**
 * Command policy gate — deny destructive / secret-exfil commands, optionally
 * "ask" on sensitive ones. Pattern-based and fully config-driven.
 *
 * Generalized from the octopus-starter-kit permission deny-list.
 */

export interface PolicyConfig {
  denyPatterns: string[];
  askPatterns?: string[];
  reason?: string;
}

export type PolicyVerdict =
  | { decision: "allow" }
  | { decision: "deny"; pattern: string; reason: string }
  | { decision: "ask"; pattern: string; reason: string };

function firstMatch(command: string, patterns: string[]): string | null {
  for (const p of patterns) {
    let re: RegExp;
    try {
      re = new RegExp(p, "i");
    } catch {
      continue;
    }
    if (re.test(command)) return p;
  }
  return null;
}

/**
 * Evaluate a Bash command against the policy. Deny wins over ask; ask wins over
 * allow. Empty command → allow.
 */
export function evaluateCommand(command: string, cfg: PolicyConfig): PolicyVerdict {
  if (!command) return { decision: "allow" };

  const denied = firstMatch(command, cfg.denyPatterns ?? []);
  if (denied) {
    return {
      decision: "deny",
      pattern: denied,
      reason:
        cfg.reason ??
        `Command matched a blocked pattern (${denied}) and was denied by claude-guardrails.`,
    };
  }

  const asked = firstMatch(command, cfg.askPatterns ?? []);
  if (asked) {
    return {
      decision: "ask",
      pattern: asked,
      reason: `Command matched a sensitive pattern (${asked}); operator confirmation required.`,
    };
  }

  return { decision: "allow" };
}
