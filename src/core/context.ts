export interface ContextBudgetSettings {
  maxPromptChars: number;
  maxTranscriptBytes: number;
}

export interface ContextBudgetWarning {
  promptChars: number;
  promptTokensApprox: number;
  transcriptBytes?: number;
  reasons: string[];
}

export function approxTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function contextBudgetWarning(
  prompt: string,
  transcriptBytes: number | null,
  cfg: ContextBudgetSettings,
): ContextBudgetWarning | null {
  const reasons: string[] = [];
  if (cfg.maxPromptChars > 0 && prompt.length > cfg.maxPromptChars) {
    reasons.push(`prompt has ${prompt.length} chars, above ${cfg.maxPromptChars}`);
  }
  if (
    transcriptBytes != null &&
    cfg.maxTranscriptBytes > 0 &&
    transcriptBytes > cfg.maxTranscriptBytes
  ) {
    reasons.push(`transcript has ${transcriptBytes} bytes, above ${cfg.maxTranscriptBytes}`);
  }
  if (reasons.length === 0) return null;
  return {
    promptChars: prompt.length,
    promptTokensApprox: approxTokens(prompt),
    transcriptBytes: transcriptBytes ?? undefined,
    reasons,
  };
}

export function formatContextBudgetWarning(w: ContextBudgetWarning): string {
  const parts = w.reasons.join("; ");
  return (
    `claude-agent-guardrails context warning: ${parts}. ` +
    `Approx prompt tokens: ${w.promptTokensApprox}. ` +
    `Split the request, summarize first, or checkpoint before long autonomous work.`
  );
}
