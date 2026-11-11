# Architecture

```
adapters (read-only)          normalize            store                 read
─────────────────────         ─────────            ─────                 ────
Claude Code JSONL   ┐
Codex JSONL         │
opencode SQLite     │         conversation        ~/.omnihist/          CLI
WorkBuddy JSONL     ├──────▶  { source,       ──▶  omnihist.db     ──▶  search / show
Qoder SQLite        │          externalId,         (SQLite + FTS5)       export / stats
MausBot SQLite      │          title, cwd,                                MCP server
Gemini JSON         │          messages[] }                               (stdio)
...                 ┘
```

## Data model

Two tables plus a full-text index:

- `conversation(id, source, external_id, title, project, cwd, model, created_at, updated_at, meta)`
  - `id = source + ":" + external_id`
  - unique on `(source, external_id)`
- `message(id, conversation_id, external_id, seq, role, kind, created_at, text, fts_text, content_hash, meta)`
  - unique on `(conversation_id, external_id)`
  - `content_hash = sha256(text)`; an unchanged hash skips the update
- `message_fts` — FTS5 external-content index over `fts_text`
- `sync_state(source, cursor, updated_at, stats)` — incremental watermark
- `conversation`/`message` cascade on delete

## Sync

1. Adapter `detect()` returns the paths that exist on this machine.
2. `scan({ since })` reads only files/rows newer than the cursor (with a one-hour overlap).
3. `saveConversations` upserts in one transaction.
4. The new max `updated_at` is stored as the next cursor.

Re-running is idempotent: the same row is updated only when its content hash changes.

## Dedup

Two levels:

- **Row level** — `(conversation_id, external_id)` makes repeated imports update, not duplicate.
- **Content level** — `content_hash` is indexed, so the same message text is identifiable across
  tools. The blob/refcount layer from the `brain` experiment can be added later if storage matters.

## Chinese search

SQLite FTS5 with `unicode61` does not split Chinese into words. Before indexing, each CJK character
is surrounded by spaces (`ftsText`), and the query is turned into quoted per-character terms.
That makes two-character queries work without a tokenizer service.

## Adapters

An adapter is a module exporting:

```js
export const id = 'tool-id';
export const name = 'Tool Name';
export function detect() { return [{ path, label }]; }
export async function scan({ since }) { return [conversation]; }
```

A conversation is:

```js
{
  source, externalId, title, cwd, model, createdAt, updatedAt,
  messages: [{ id, role, kind, at, text }]
}
```

No adapter writes to the source. No adapter needs network access.

## MCP

`omnihist mcp` speaks JSON-RPC over stdio:

- `initialize`
- `tools/list`
- `tools/call` → `search_conversations`, `get_conversation`, `list_recent`

It opens the same SQLite database read/write (WAL), so the watcher/sync can run while an agent queries.

## Deliberate limits

- No vector store in v1. Full-text is deterministic, cheap and good enough for "where did I say X".
- No web UI in v1.
- No reverse export into tool-native formats; `omnihist export` writes Markdown/JSON.
- Secrets are redacted with regexes before storage; this is best effort, not a guarantee.
