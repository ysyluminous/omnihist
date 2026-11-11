# Supported sources

`omnihist scan` detects these paths automatically. `omnihist sync` reads them read-only.

| Source id | Tool | Paths read | Notes |
|---|---|---|---|
| `claude-code` | Claude Code | `~/.claude/projects/**/*.jsonl` | user/assistant messages, tool calls kept as text |
| `codex` | Codex CLI | `~/.codex/sessions/**/rollout-*.jsonl`, `~/.codex/archived_sessions/**` | plain JSONL; `.jsonl.zst` skipped |
| `opencode` | opencode | `~/.local/share/opencode/opencode.db` (or `$XDG_DATA_HOME`) | session/message/part tables |
| `workbuddy` | WorkBuddy / CodeBuddy | `~/.workbuddy/projects/**/*.jsonl`, `~/.codebuddy/projects/**/*.jsonl` | message + reasoning records |
| `qoder` | Qoder / Qoder CN | `%APPDATA%/com.qodercn.app.stable/main.sqlite`, `%APPDATA%/com.qoder.app.stable/main.sqlite` | handles both schemas (with/without `role`) |
| `mausbot` | OpenMausBot | `~/.openmausbot/messages.db` | only messages with text; activity rows are skipped |
| `dsh` | DeepSeek Harness / DSH Desktop | `~/.dsh/sessions/**/session.v4.jsonl.zstd` | multi-frame zstd; decodes every appended frame |
| `grokbot` | Grok Bot | `%APPDATA%/Grok Bot/sand-client-persistence/*.blob` | JSON entries (`send-message`, `message`) |
| `trae` | TRAE / TRAE CN / TRAE SOLO / TRAE Work | `~/.trae-cn/memory/projects/**/session_memory_*.jsonl` | full chat DB is encrypted; reads TRAE session memory |
| `gemini-cli` | Gemini CLI | `~/.gemini/tmp/*/chats/*.json` | JSON session files |
| `openclaw` | OpenClaw | `~/.openclaw/agents/*/sessions/*.jsonl` | `message` records |
| `aider` | Aider | `~/.aider.chat.history.md` | Markdown history; project-level files are roadmap |
| `continue` | Continue | `~/.continue/sessions/*.json` | `history[].message` |
| `goose` | Goose | `~/.local/share/goose/sessions/*.jsonl`, `%APPDATA%/Block/goose/data/sessions/*.jsonl` | tolerant JSONL |
| `copilot-chat` | GitHub Copilot Chat (VS Code) | `%APPDATA%/Code/User/workspaceStorage/*/chatSessions/*.json` | request/response pairs |
| `vscode-tasks` | Cline / Roo Code / Kilo Code | `%APPDATA%/Code/User/globalStorage/{saoudrizwan.claude-dev,rooveterinaryinc.roo-cline,kilocode.kilo-code}/tasks/*/api_conversation_history.json` | one conversation per task |
| `chatgpt-export` | ChatGPT | `conversations.json` via `omnihist import` | follows the current_node branch |
| `claude-export` | Claude | `conversations.json` via `omnihist import` | `chat_messages[]` |

## Verified on this machine (2026-11-11)

| Source | Conversations | Messages |
|---|---:|---:|
| `vscode-tasks` | 956 | 34,296 |
| `workbuddy` | 251 | 24,899 |
| `opencode` | 808 | 6,251 |
| `mausbot` | 352 | 3,478 |
| `qoder` | 32 | 1,442 |
| `claude-code` | 7 | 129 |
| `copilot-chat` | 19 | 92 |
| `gemini-cli` | 1 | 11 |
| `openclaw` | 1 | 1 |
| `dsh` | 2 | 314 |
| `grokbot` | 6 | 55 |
| `trae` | 46 | 1,636 |

## Not supported yet

- **Cursor** — chat lives inside `state.vscdb` under version-specific keys.
- **Windsurf, Zed, Kiro, Warp** — private formats.
- **TRAE full chat** — the chat database is encrypted; only TRAE's own session memory is readable.
- **JetBrains AI Assistant** — IDE workspace XML/binary.
- **Antigravity** — protobuf logs.
- **GitHub Copilot CLI** — log format not stable.
- **Qwen Code, Kimi Code, Amp, Devin, Factory, OpenHands, Jules** — community adapters possible.
- **ChatGPT / Claude / Gemini live web capture** — needs a browser extension; exports for ChatGPT/Claude work today, Gemini Takeout is pending.
- **Codex `.jsonl.zst` archives** — needs zstd.
- **Cloud agents** — sessions live behind vendor APIs.

Adding one is one file in `src/adapters/` plus one line in `src/adapters/index.mjs`.
