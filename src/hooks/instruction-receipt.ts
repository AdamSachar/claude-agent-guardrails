#!/usr/bin/env node
/**
 * instruction-receipt - UserPromptSubmit. When a prompt looks like real work,
 * injects the local instruction files that the agent should read first.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { readHookInput, emit, eventContext } from "../core/protocol.js";
import { loadConfig, guardrailsDisabled } from "../core/config.js";
import {
  shouldAttachInstructionReceipt,
  formatInstructionReceipt,
} from "../core/instructions.js";

const input = await readHookInput();
if (guardrailsDisabled() || input.hook_event_name !== "UserPromptSubmit") emit(null);

const cwd = input.cwd ?? process.cwd();
const cfg = loadConfig(cwd);
if (!shouldAttachInstructionReceipt(input.prompt ?? "", cfg.instructions)) emit(null);

const present = cfg.instructions.instructionFiles.filter((file) => existsSync(resolve(cwd, file)));
const message = formatInstructionReceipt(present);
if (!message) emit(null);

emit(eventContext("UserPromptSubmit", message));
