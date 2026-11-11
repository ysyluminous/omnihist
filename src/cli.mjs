#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { openDb, DEFAULT_DB, search, listConversations, getConversation, stats, saveConversations } from './db.mjs';
import { runSync } from './sync.mjs';
import { adapters } from './adapters/index.mjs';
import { importExport } from './import.mjs';
import { startMcp } from './mcp.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0] || 'help';
const flags = {};
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const eq = a.indexOf('=');
    if (eq > 2) {
      flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { flags[key] = next; i++; }
      else flags[key] = true;
    }
  } else if (!flags._) {
    flags._ = a;
  }
}

const dbPath = flags.db || process.env.OMNIHIST_DB || DEFAULT_DB;
const db = () => openDb(dbPath);

main().catch((e) => {
  console.error(`omnihist: ${e.message}`);
  process.exit(1);
});

async function main() {
  switch (cmd) {
    case 'scan': return scan();
    case 'sync': return sync();
    case 'search': return doSearch();
    case 'list': return list();
    case 'show': return show();
    case 'export': return doExport();
    case 'stats': return doStats();
    case 'import': return doImport();
    case 'mcp': return startMcp(db());
    case 'help': case '--help': case '-h': return help();
    default:
      console.error(`unknown command: ${cmd}`);
      help();
      process.exit(1);
  }
}

function scan() {
  const rows = adapters.map((a) => {
    const detected = typeof a.detect === 'function' ? a.detect() : [];
    return { source: a.id, name: a.name, found: detected.length ? 'yes' : '-', paths: detected.map((d) => d.label).join(', ') };
  });
  printTable(rows, ['source', 'name', 'found', 'paths']);
  console.log('\nRun `omnihist sync` to import everything found.');
}

async function sync() {
  const d = db();
  const results = await runSync(d, { only: flags.source, full: Boolean(flags.full) });
  printTable(results.map((r) => ({
    source: r.id, status: r.status, conversations: r.conversations ?? '', messages: r.messages ?? '',
    ms: r.ms ?? '', note: r.error || (r.status === 'not found' ? 'not installed' : ''),
  })), ['source', 'status', 'conversations', 'messages', 'ms', 'note']);
  const t = stats(d);
  const total = t.reduce((n, r) => n + r.messages, 0);
  console.log(`\nDB: ${dbPath}`);
  console.log(`Total: ${t.reduce((n, r) => n + r.conversations, 0)} conversations, ${total} messages`);
}

function doSearch() {
  const q = flags._;
  if (!q) throw new Error('usage: omnihist search "query" [--limit 20]');
  const d = db();
  const rows = search(d, q, Number(flags.limit || 20));
  if (!rows.length) { console.log('no matches'); return; }
  for (const r of rows) {
    console.log(`[${r.source}] ${fmt(r.created_at)}  ${r.title || '(untitled)'}`);
    console.log(`  ${String(r.snippet || '').replace(/\s+/g, ' ').slice(0, 300)}`);
    console.log(`  id: ${r.conversation_id}`);
  }
}

function list() {
  const d = db();
  const rows = listConversations(d, { source: flags.source, limit: Number(flags.limit || 30) });
  printTable(rows.map((r) => ({
    updated: fmt(r.updated_at), source: r.source, messages: r.messages,
    title: (r.title || '(untitled)').slice(0, 60), id: r.id,
  })), ['updated', 'source', 'messages', 'title', 'id']);
}

function show() {
  const id = flags._;
  if (!id) throw new Error('usage: omnihist show <conversation-id>');
  const d = db();
  const got = getConversation(d, id);
  if (!got) throw new Error(`conversation not found: ${id}`);
  const c = got.conversation;
  console.log(`# ${c.title || '(untitled)'}`);
  console.log(`${c.source}  ${c.id}`);
  if (c.cwd) console.log(`cwd: ${c.cwd}`);
  console.log('');
  for (const m of got.messages) {
    console.log(`## ${m.role || '?'} · ${fmt(m.created_at)}`);
    console.log(m.text || '');
    console.log('');
  }
}

function doExport() {
  if (flags.all) return exportAll();
  const id = flags._;
  if (!id) throw new Error('usage: omnihist export <conversation-id> [--format md|json] [--out file]');
  const d = db();
  const got = getConversation(d, id);
  if (!got) throw new Error(`conversation not found: ${id}`);
  const format = flags.format || 'md';
  let body;
  if (format === 'json') {
    body = JSON.stringify(got, null, 2);
  } else {
    const c = got.conversation;
    body = `# ${c.title || '(untitled)'}\n\n- source: ${c.source}\n- id: ${c.id}\n- cwd: ${c.cwd || ''}\n\n` +
      got.messages.map((m) => `## ${m.role || '?'} · ${fmt(m.created_at)}\n\n${m.text || ''}\n`).join('\n');
  }
  if (flags.out) {
    fs.writeFileSync(flags.out, body, 'utf8');
    console.log(`wrote ${flags.out}`);
  } else {
    console.log(body);
  }
}

function exportAll() {
  const d = db();
  const out = path.resolve(flags.out || 'omnihist-export');
  const rows = listConversations(d, { limit: 100000 });
  let n = 0;
  for (const r of rows) {
    const got = getConversation(d, r.id);
    if (!got) continue;
    const c = got.conversation;
    const dir = path.join(out, c.source);
    fs.mkdirSync(dir, { recursive: true });
    const safe = c.id.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120);
    const body = `# ${c.title || '(untitled)'}\n\n- source: ${c.source}\n- id: ${c.id}\n- cwd: ${c.cwd || ''}\n- updated: ${c.updated_at ? new Date(Number(c.updated_at)).toISOString() : ''}\n\n` +
      got.messages.map((m) => `## ${m.role || '?'} · ${fmt(m.created_at)}\n\n${m.text || ''}\n`).join('\n');
    fs.writeFileSync(path.join(dir, safe + '.md'), body, 'utf8');
    n++;
  }
  console.log(`exported ${n} conversations to ${out}`);
}

function doStats() {
  const d = db();
  const rows = stats(d);
  printTable(rows.map((r) => ({
    source: r.source, conversations: r.conversations, messages: r.messages,
    text: r.text_messages, last: fmt(r.last_at),
  })), ['source', 'conversations', 'messages', 'text', 'last']);
  const total = rows.reduce((n, r) => n + r.messages, 0);
  console.log(`\nDB: ${dbPath}`);
  console.log(`Total: ${rows.reduce((n, r) => n + r.conversations, 0)} conversations, ${total} messages`);
  try {
    const size = fs.statSync(dbPath).size;
    console.log(`Size: ${(size / 1024 / 1024).toFixed(1)} MB`);
  } catch {}
}

function doImport() {
  const input = flags._;
  if (!input) throw new Error('usage: omnihist import <path-to-conversations.json-or-export-folder>');
  const { source, conversations } = importExport(path.resolve(input));
  const d = db();
  const n = saveConversations(d, conversations);
  console.log(`${source}: ${n.conversations} conversations, ${n.messages} messages`);
}

function help() {
  console.log(`omnihist — one searchable history for every AI tool

Usage:
  omnihist scan                     detect installed AI tools
  omnihist sync [--source id] [--full]
                                    import new/changed conversations
  omnihist search "query" [--limit N]
                                    full-text search across all tools
  omnihist list [--source id] [--limit N]
                                    recent conversations
  omnihist show <id>                print one conversation
  omnihist export <id> [--format md|json] [--out file]
                                    export one conversation
  omnihist export --all --out <dir>
                                    export every conversation as Markdown (for SAG Wiki / grep)
  omnihist import <path>            import ChatGPT/Claude export JSON
  omnihist stats                    counts by tool
  omnihist mcp                      run MCP server over stdio

Options:
  --db <file>                       database path (default: ~/.omnihist/omnihist.db)
  --source <id>                     limit sync/list to one source
  --full                            ignore cursors and rescan

Data stays local. Nothing is uploaded.`);
}

function fmt(ms) {
  if (!ms) return '';
  const d = new Date(Number(ms));
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function printTable(rows, cols) {
  if (!rows.length) { console.log('(empty)'); return; }
  const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  const line = (vals) => vals.map((v, i) => String(v ?? '').padEnd(widths[i])).join('  ');
  console.log(line(cols));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const r of rows) console.log(line(cols.map((c) => r[c])));
}
