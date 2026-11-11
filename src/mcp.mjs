import readline from 'node:readline';
import { search, getConversation, listConversations } from './db.mjs';

const TOOLS = [
  {
    name: 'search_conversations',
    description: 'Search the user\'s past conversations across every AI tool (Claude Code, Codex, opencode, WorkBuddy, Qoder, OpenMausBot, ChatGPT/Claude exports, and more). Returns matching snippets with conversation ids.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words or phrase to search for.' },
        limit: { type: 'number', description: 'Max results, default 10.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_conversation',
    description: 'Read one full conversation by id, including every message in order.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Conversation id from search results.' } },
      required: ['id'],
    },
  },
  {
    name: 'list_recent',
    description: 'List the most recently updated conversations, optionally filtered by source.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results, default 10.' },
        source: { type: 'string', description: 'Optional source id, e.g. claude-code.' },
      },
    },
  },
];

export function startMcp(db) {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', async (line) => {
    const s = line.trim();
    if (!s) return;
    let msg;
    try { msg = JSON.parse(s); } catch { return; }
    if (msg.id === undefined) return; // notification
    try {
      const result = await dispatch(db, msg);
      send({ jsonrpc: '2.0', id: msg.id, result });
    } catch (e) {
      send({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: e.message } });
    }
  });
}

async function dispatch(db, msg) {
  switch (msg.method) {
    case 'initialize':
      return {
        protocolVersion: msg.params?.protocolVersion || '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'omnihist', version: '0.1.0' },
      };
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: TOOLS };
    case 'tools/call':
      return callTool(db, msg.params?.name, msg.params?.arguments || {});
    default:
      throw new Error(`unknown method: ${msg.method}`);
  }
}

function callTool(db, name, args) {
  if (name === 'search_conversations') {
    const rows = search(db, args.query || '', Number(args.limit || 10));
    const text = rows.length
      ? rows.map((r) => `[${r.source}] ${r.title || '(untitled)'}\n${r.snippet}\nid: ${r.conversation_id}`).join('\n\n')
      : 'No matches.';
    return { content: [{ type: 'text', text }] };
  }
  if (name === 'get_conversation') {
    const got = getConversation(db, args.id);
    if (!got) return { content: [{ type: 'text', text: 'Conversation not found.' }], isError: true };
    const c = got.conversation;
    const text = `# ${c.title || '(untitled)'}\n${c.source} · ${c.id}\n\n` +
      got.messages.map((m) => `## ${m.role || '?'}\n${m.text || ''}`).join('\n\n');
    return { content: [{ type: 'text', text: text.slice(0, 120000) }] };
  }
  if (name === 'list_recent') {
    const rows = listConversations(db, { source: args.source, limit: Number(args.limit || 10) });
    const text = rows.length
      ? rows.map((r) => `${r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 10) : ''} [${r.source}] ${r.title || '(untitled)'} (${r.messages} msgs)\nid: ${r.id}`).join('\n')
      : 'No conversations.';
    return { content: [{ type: 'text', text }] };
  }
  throw new Error(`unknown tool: ${name}`);
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}
