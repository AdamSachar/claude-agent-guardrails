/**
 * Prompt-injection scanner for content written into agent-context files.
 *
 * Catches embedded "ignore previous instructions"-style payloads + invisible
 * Unicode before they enter the agent's context. Generalized from the GSD
 * prompt-guard. Advisory by default - surfaces, does not deadlock.
 */

export const DEFAULT_INJECTION_PATTERNS: string[] = [
  "ignore\\s+(all\\s+)?previous\\s+instructions",
  "ignore\\s+(all\\s+)?above\\s+instructions",
  "disregard\\s+(all\\s+)?previous",
  "forget\\s+(all\\s+)?(your\\s+)?instructions",
  "override\\s+(system|previous)\\s+(prompt|instructions)",
  "you\\s+are\\s+now\\s+(?:a|an|the)\\s+",
  "pretend\\s+(?:you(?:'re| are)\\s+|to\\s+be\\s+)",
  "from\\s+now\\s+on,?\\s+you\\s+(?:are|will|should|must)",
  "(?:print|output|reveal|show|display|repeat)\\s+(?:your\\s+)?(?:system\\s+)?(?:prompt|instructions)",
  "</?(?:system|assistant|human)>",
  "\\[SYSTEM\\]",
  "\\[INST\\]",
  "<<\\s*SYS\\s*>>",
];

// Zero-width / bidi / soft-hyphen code points used to smuggle hidden text.
// Stored as numbers (pure-ASCII source) to avoid embedding invisible characters.
const INVISIBLE_CODE_POINTS = new Set<number>([
  0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2028, 0x2029, 0x202a, 0x202b, 0x202c,
  0x202d, 0x202e, 0x202f, 0xfeff, 0x00ad,
]);

export function hasInvisibleUnicode(content: string): boolean {
  for (const ch of content) {
    const cp = ch.codePointAt(0);
    if (cp != null && INVISIBLE_CODE_POINTS.has(cp)) return true;
  }
  return false;
}

export interface InjectionFinding {
  patterns: string[];
  invisibleUnicode: boolean;
}

export function scanInjection(
  content: string,
  patterns: string[] = DEFAULT_INJECTION_PATTERNS,
): InjectionFinding {
  const hits: string[] = [];
  if (content) {
    for (const p of patterns) {
      let re: RegExp;
      try {
        re = new RegExp(p, "i");
      } catch {
        continue;
      }
      if (re.test(content)) hits.push(p);
    }
  }
  return {
    patterns: hits,
    invisibleUnicode: content ? hasInvisibleUnicode(content) : false,
  };
}

export function hasFindings(f: InjectionFinding): boolean {
  return f.patterns.length > 0 || f.invisibleUnicode;
}

/** True if `filePath` is an agent-context file we care about scanning. */
export function isWatchedPath(filePath: string, watchSubstrings: string[]): boolean {
  if (!filePath) return false;
  return watchSubstrings.some((s) => filePath.includes(s));
}
