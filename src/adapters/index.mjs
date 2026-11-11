import * as claudeCode from './claude-code.mjs';
import * as codex from './codex.mjs';
import * as opencode from './opencode.mjs';
import * as workbuddy from './workbuddy.mjs';
import * as qoder from './qoder.mjs';
import * as mausbot from './mausbot.mjs';
import * as geminiCli from './gemini-cli.mjs';
import * as openclaw from './openclaw.mjs';
import * as aider from './aider.mjs';
import * as continueAdapter from './continue.mjs';
import * as goose from './goose.mjs';
import * as copilotChat from './copilot-chat.mjs';
import * as vscodeTasks from './vscode-tasks.mjs';
import * as dsh from './dsh.mjs';
import * as grokbot from './grokbot.mjs';
import * as trae from './trae.mjs';

export const adapters = [
  claudeCode, codex, opencode, workbuddy, qoder, mausbot, geminiCli,
  openclaw, aider, continueAdapter, goose, copilotChat, vscodeTasks, dsh, grokbot, trae,
];

export function findAdapter(id) {
  return adapters.find((a) => a.id === id);
}
