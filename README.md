# omnihist

**一个命令，把你所有 AI 工具的对话收进同一个可搜索的本地库。**

Claude Code、Codex、opencode、WorkBuddy、Qoder、OpenMausBot、DeepSeek Harness、Grok Bot、TRAE、Gemini CLI、OpenClaw、Cline、Copilot Chat……
它们各自把历史藏在不同的文件夹、SQLite 和 JSONL 里，互相看不见。omnihist 只读这些文件，
统一成一套 `会话 → 消息`，存进一个 SQLite 文件，再通过命令行和 MCP 交还给任何 AI。

```
~/.claude/projects/*.jsonl      ┐
~/.workbuddy/projects/*.jsonl   │
opencode.db / main.sqlite       ├──▶  ~/.omnihist/omnihist.db  ──▶  omnihist search
~/.openmausbot/messages.db      │        （SQLite + FTS5）          omnihist mcp
ChatGPT / Claude 导出 JSON      ┘                                   任意 agent 召回
```

不换工具，不改工具，不上传。你的历史还是你的。

---

## 为什么做这个

你现在至少有四个 AI 在同时干活。每个都记得自己那一摊，别的都不知道。

- **找一个旧结论**：只记得"上周跟某个 AI 聊过缓存键怎么定"，但忘了是哪个工具、哪个项目。
- **换工具就失忆**：在 Codex 里调通的东西，换到 Claude Code 要重新解释一遍。
- **工具会自己删历史**：Claude Code 默认 30 天清一次，重装一次也可能清空。
- **换电脑就归零**：会话散在十几个目录里，没有一个地方能整体拷走。
- **决策留不下来**：真正值钱的是"当时为什么这么定"，它埋在几万条消息里，搜不到就等于没有。

omnihist 解决的不是"再做一个聊天客户端"，而是**把已经发生过的对话变成一份可检索、可备份、可交接的资产**。

---

## 现在支持什么

| 工具 | 读什么 | 平台 |
|---|---|---|
| **Claude Code** | `~/.claude/projects/**/*.jsonl` | macOS / Linux / Windows |
| **Codex CLI** | `~/.codex/sessions/**/rollout-*.jsonl` | 三平台 |
| **opencode** | `~/.local/share/opencode/opencode.db` | 三平台 |
| **WorkBuddy / CodeBuddy** | `~/.workbuddy/projects/**/*.jsonl`、`~/.codebuddy/projects` | 三平台 |
| **Qoder / Qoder CN** | `%APPDATA%/com.qodercn.app.stable/main.sqlite` 等 | Windows / macOS |
| **OpenMausBot** | `~/.openmausbot/messages.db` | 三平台 |
| **DeepSeek Harness / DSH Desktop** | `~/.dsh/sessions/**/session.v4.jsonl.zstd` | 三平台 |
| **Grok Bot** | `%APPDATA%/Grok Bot/sand-client-persistence/*.blob` | Windows / macOS |
| **TRAE / TRAE CN / TRAE SOLO / TRAE Work** | `~/.trae-cn/memory/projects/**/session_memory_*.jsonl` | Windows / macOS |
| **Gemini CLI** | `~/.gemini/tmp/*/chats/*.json` | 三平台 |
| **OpenClaw** | `~/.openclaw/agents/*/sessions/*.jsonl` | 三平台 |
| **Aider** | `~/.aider.chat.history.md` | 三平台 |
| **Continue** | `~/.continue/sessions/*.json` | 三平台 |
| **Goose** | `~/.local/share/goose/sessions/*.jsonl` 等 | 三平台 |
| **GitHub Copilot Chat** | VS Code `workspaceStorage/*/chatSessions/*.json` | 三平台 |
| **Cline / Roo Code / Kilo Code** | VS Code `globalStorage/*/tasks/*/api_conversation_history.json` | 三平台 |
| **ChatGPT 导出** | `conversations.json`（Settings → Data controls → Export） | 手动导入 |
| **Claude 导出** | `conversations.json`（Settings → Export data） | 手动导入 |

`omnihist scan` 会在你的机器上自动找这些路径，找不到就跳过。

### 还没支持的热门工具

| 工具 | 为什么还没做 |
|---|---|
| **Cursor** | 聊天存在 `state.vscdb` 的内部键里，格式随版本变，容易读错 |
| **Windsurf / Zed / Kiro / Warp** | 各自私有格式，需要单独逆向 |
| **TRAE 的完整对话** | 聊天库是加密的（`ModularData/ai-chat/database.db`），只能读 TRAE 自己写的 session memory |
| **JetBrains AI Assistant** | 存在 IDE 的 XML/二进制 workspace 里 |
| **Antigravity** | protobuf 日志，需要单独解码 |
| **GitHub Copilot CLI** | 日志格式未稳定 |
| **Qwen Code / Kimi Code / Amp / Devin / Factory / OpenHands / Jules** | 社区适配器可加，但还没写 |
| **ChatGPT / Claude / Gemini 网页版实时抓取** | 需要浏览器扩展；目前只支持导出文件（Gemini 导出也还没解析） |
| **Codex 的 `.jsonl.zst` 归档** | 需要 zstd 解压，当前跳过 |
| **云 agent（Codex cloud、Jules、Devin cloud）** | 需要各家 API，不在本地文件里 |

这张表就是 roadmap。每加一个，只需要一个 `src/adapters/xxx.mjs`。

---

## 安装

需要 **Node.js 22.5+**（用到内置的 `node:sqlite`，零第三方依赖）。

```bash
# 从 npm（发布后）
npm install -g omnihist

# 或者直接从 GitHub
npm install -g github:ysyluminous/omnihist

# 或者克隆后本地链接
git clone https://github.com/ysyluminous/omnihist.git
cd omnihist
npm link
```

检查：

```bash
omnihist scan
```

会列出这台机器上检测到了哪些工具、分别读哪个路径。

---

## 使用

### 1. 同步

```bash
omnihist sync
```

第一次会把能读到的历史全部导入；之后再跑只读新增和变化的部分（每个源记一个游标）。

```bash
omnihist sync --source workbuddy     # 只同步一个工具
omnihist sync --full                 # 忽略游标，全部重扫（幂等，不会重复）
```

### 2. 搜索

```bash
omnihist search "缓存键"
omnihist search "connection pool exhausted" --limit 10
```

输出会带来源、时间、标题、命中片段和会话 id。中文按字切分，两个字也能搜。

### 3. 看一条对话

```bash
omnihist list --limit 20
omnihist show <conversation-id>
omnihist export <conversation-id> --format md --out ./one.md
```

### 4. 统计

```bash
omnihist stats
```

### 5. 导入官方导出

```bash
omnihist import ~/Downloads/chatgpt-export
omnihist import ~/Downloads/claude-export/conversations.json
```

### 6. 让 AI 自己查（MCP）

omnihist 自带一个 stdio MCP server，暴露三个工具：

- `search_conversations` — 跨所有工具搜索
- `get_conversation` — 读一整条对话
- `list_recent` — 最近会话

Claude Code：

```bash
claude mcp add omnihist -- omnihist mcp
```

opencode / 其他 MCP 客户端（`mcp.json`）：

```json
{
  "mcpServers": {
    "omnihist": {
      "command": "omnihist",
      "args": ["mcp"]
    }
  }
}
```

之后直接问 agent："我们之前关于缓存键是怎么定的？" 它会自己搜到 Codex 或 Claude Code 里的那条对话。

---

## 它是怎么做的

- **只读源文件。** 不写回任何工具，不改你的配置。
- **一个 SQLite 文件。** 默认 `~/.omnihist/omnihist.db`，拷走就是全部。
- **增量。** `sync_state` 记每个源的最后时间；重复跑是幂等的。
- **去重。** 每条消息算 sha256；同一段内容在库里只有一份索引，重复导入不会膨胀。
- **中文可搜。** FTS5 + 按字切分，不依赖分词服务。
- **默认脱敏。** 常见的 `sk-`、`ghp_`、`AKIA`、Bearer token、password 字段在入库前替换成 `***`；要保留原文用 `OMNIHIST_REDACT=0`。
- **单条消息上限 20 万字符**，避免一条超长工具输出把库撑爆；可用 `OMNIHIST_MAX_CHARS` 调整。

数据库大概多大？本机 7 万条消息（含大量工具输出）约 700MB。纯聊天会小很多。

---

## 自己加一个适配器

在 `src/adapters/` 新建一个文件，导出 `id`、`name`、`detect()`、`scan()`：

```js
import path from 'node:path';
import { HOME, exists, walk, jsonl, textOf, titleFrom, toMs } from '../util.mjs';

export const id = 'my-tool';
export const name = 'My Tool';

export function detect() {
  const p = path.join(HOME, '.mytool', 'sessions');
  return exists(p) ? [{ path: p, label: '~/.mytool/sessions' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const fp of walk(detect()[0].path, (p, n) => n.endsWith('.jsonl'))) {
    const messages = [];
    for (const line of jsonl(fp)) {
      messages.push({ id: line.id, role: line.role, at: toMs(line.time), text: textOf(line.content) });
    }
    out.push({
      source: id,
      externalId: path.basename(fp, '.jsonl'),
      title: titleFrom(messages.find((m) => m.role === 'user')?.text),
      messages,
    });
  }
  return out;
}
```

然后在 `src/adapters/index.mjs` 里加一行 import 和数组项。`detect()` 返回空数组就等于"这台机器没装"。

---

## 隐私

- 全部数据只在本机，没有遥测、没有上传、没有账号。
- `omnihist` 不会修改任何源文件。
- 默认脱敏常见密钥；但历史里可能还有别的敏感内容，**这个库要像聊天记录本身一样保护**。
- 想同步到别的机器：直接拷 `~/.omnihist/omnihist.db`（先停掉正在跑的 sync），或者放进你自己的私有网盘。

---

## 和别的工具什么关系

- **hstry / deja-vu / cass / Hansard** 都很强，思路一致：读已有会话，做一个统一索引。omnihist 的差别是：零依赖、单文件、默认脱敏、中文按字检索、适配器 30 行一个，并且同时覆盖 WorkBuddy + Qoder + OpenMausBot 这类国内/自建工具。
- 它不是聊天客户端，不替你发消息，不接管任何工具。
- 它也不是"记忆层"（不抽取事实、不做向量库）。它先把**原始对话**收齐；抽取和总结可以在这个库之上做。

---

## Roadmap

- [ ] Cursor / Windsurf / Zed / Kiro / Warp 适配器
- [ ] Gemini Takeout 导出
- [ ] 浏览器扩展，实时收 ChatGPT / Claude / Gemini 网页对话
- [ ] 可选的语义检索（本地 embedding）
- [ ] `omnihist serve` 本地 Web UI
- [ ] 加密库（SQLCipher 或应用层）
- [ ] 决策/待办抽取，输出 Markdown

---

## License

MIT。见 [LICENSE](LICENSE)。

做这个项目时参考了 hstry、deja-vu、cass、Hansard、Pomnia 的公开文档和适配器思路，代码为独立实现。
