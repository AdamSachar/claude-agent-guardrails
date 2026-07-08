export interface InstructionReceiptSettings {
  enabled: boolean;
  instructionFiles: string[];
  promptPatterns: string[];
}

export function shouldAttachInstructionReceipt(
  prompt: string,
  cfg: Pick<InstructionReceiptSettings, "enabled" | "promptPatterns">,
): boolean {
  if (!cfg.enabled || !prompt.trim()) return false;
  for (const pattern of cfg.promptPatterns) {
    try {
      if (new RegExp(pattern, "i").test(prompt)) return true;
    } catch {
      continue;
    }
  }
  return false;
}

export function formatInstructionReceipt(files: string[]): string | null {
  if (files.length === 0) return null;
  return (
    "claude-agent-guardrails instruction receipt: before editing or running tools, " +
    `read the project instruction files that exist here: ${files.join(", ")}. ` +
    "Treat them as the local operating contract for this session."
  );
}
