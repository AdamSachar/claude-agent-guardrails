/**
 * Cost prediction + spend-velocity logic.
 *
 * `predictBashCost` estimates the $ cost of a Bash command BEFORE it runs, by
 * matching configurable rules. `velocityAlarm` reads a JSONL spend ledger and
 * flags when the recent burn-rate would exhaust the daily budget too fast.
 *
 * Generalized from the octopus-starter-kit budget-predictor / cost-velocity
 * hooks, rebuilt as pure functions against the current Claude Code contract.
 */

export interface CostRule {
  /** Regex source (case-insensitive) matched against the command. */
  pattern: string;
  /** Flat estimated cost when the rule matches. */
  estimatedUSD: number;
  /** If set, multiply the first captured integer group by this $ amount. */
  perMatchGroupUSD?: number;
  label: string;
}

export interface CostMatch {
  label: string;
  costUSD: number;
}

export interface CostPrediction {
  totalUSD: number;
  matches: CostMatch[];
}

/** Estimate the cost of a Bash command from the rule set. Pure + deterministic. */
export function predictBashCost(command: string, rules: CostRule[]): CostPrediction {
  const matches: CostMatch[] = [];
  for (const rule of rules) {
    let re: RegExp;
    try {
      re = new RegExp(rule.pattern, "i");
    } catch {
      continue; // skip invalid pattern rather than crash
    }
    const m = command.match(re);
    if (!m) continue;

    let cost = rule.estimatedUSD;
    if (rule.perMatchGroupUSD != null && m[1] != null) {
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n)) cost += n * rule.perMatchGroupUSD;
    }
    if (cost > 0) matches.push({ label: rule.label, costUSD: round2(cost) });
  }
  const totalUSD = round2(matches.reduce((s, m) => s + m.costUSD, 0));
  return { totalUSD, matches };
}

export function overBudget(prediction: CostPrediction, maxPerDispatchUSD: number): boolean {
  return prediction.totalUSD > maxPerDispatchUSD;
}

// --- Spend velocity ----------------------------------------------------------

export interface LedgerEntry {
  ts?: string | number;
  timestamp?: string | number;
  cost_usd?: number;
  label?: string;
}

export interface VelocityConfig {
  dailyBudgetUSD: number;
  /** Max % of the daily budget allowed to burn in one hour before alarming. */
  maxPerHourPctOfDaily: number;
}

export interface VelocityAlarm {
  windowSpendUSD: number;
  thresholdUSD: number;
  ratio: number;
}

/** Parse a JSONL ledger string into entries, skipping malformed lines. */
export function parseLedger(jsonl: string): LedgerEntry[] {
  return jsonl
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as LedgerEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is LedgerEntry => e !== null);
}

function entryTime(e: LedgerEntry): number {
  const v = e.ts ?? e.timestamp ?? 0;
  return typeof v === "number" ? v : new Date(v).getTime();
}

/** Sum spend within the last `windowMs` relative to `now`. */
export function spendInWindow(entries: LedgerEntry[], now: number, windowMs: number): number {
  const since = now - windowMs;
  let total = 0;
  for (const e of entries) {
    const t = entryTime(e);
    if (Number.isFinite(t) && t >= since) total += e.cost_usd ?? 0;
  }
  return round2(total);
}

/**
 * Return an alarm if the last hour's spend exceeds the allowed hourly share of
 * the daily budget, else null.
 */
export function velocityAlarm(
  entries: LedgerEntry[],
  now: number,
  cfg: VelocityConfig,
): VelocityAlarm | null {
  const hourSpend = spendInWindow(entries, now, 60 * 60 * 1000);
  const thresholdUSD = round2((cfg.dailyBudgetUSD * cfg.maxPerHourPctOfDaily) / 100);
  if (thresholdUSD <= 0 || hourSpend <= thresholdUSD) return null;
  return {
    windowSpendUSD: hourSpend,
    thresholdUSD,
    ratio: round2(hourSpend / thresholdUSD),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
