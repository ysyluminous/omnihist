import fs from 'node:fs';
import path from 'node:path';
import { textOf, titleFrom, toMs, exists, isDir } from './util.mjs';

/**
 * Import official data exports. Supports ChatGPT (conversations.json)
 * and Claude (conversations.json) in their documented formats.
 */
export function importExport(input) {
  const file = resolveFile(input);
  if (!file) throw new Error(`no conversations.json found under ${input}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data)) throw new Error('unrecognized export: expected an array');
  if (data[0]?.mapping) return { source: 'chatgpt-export', conversations: data.map(chatgpt) };
  if (data[0]?.chat_messages) return { source: 'claude-export', conversations: data.map(claude) };
  throw new Error('unrecognized export format (expected ChatGPT or Claude conversations.json)');
}

function resolveFile(input) {
  if (isDir(input)) {
    const p = path.join(input, 'conversations.json');
    return exists(p) ? p : null;
  }
  return exists(input) ? input : null;
}

function chatgpt(c) {
  const mapping = c.mapping || {};
  const chain = [];
  let id = c.current_node;
  const guard = new Set();
  while (id && mapping[id] && !guard.has(id)) {
    guard.add(id);
    chain.push(mapping[id]);
    id = mapping[id].parent;
  }
  chain.reverse();
  const messages = [];
  let i = 0;
  for (const node of chain) {
    const m = node.message;
    if (!m) continue;
    const role = m.author?.role;
    if (role === 'system' || role === 'tool') continue;
    const text = textOf(m.content?.parts || m.content?.text || '');
    if (!text.trim()) continue;
    messages.push({ id: m.id || `${c.id}:${i++}`, role: role === 'assistant' ? 'assistant' : 'user', at: toMs(m.create_time) || toMs(c.create_time), text });
  }
  return {
    source: 'chatgpt-export',
    externalId: c.id || c.conversation_id || titleFrom(c.title),
    title: c.title || titleFrom(messages[0]?.text),
    cwd: null, model: null,
    createdAt: toMs(c.create_time) || messages[0]?.at || 0,
    updatedAt: toMs(c.update_time) || messages.at(-1)?.at || 0,
    messages, meta: { export: 'chatgpt' },
  };
}

function claude(c) {
  const messages = [];
  let i = 0;
  for (const m of c.chat_messages || []) {
    const text = textOf(m.text || m.content);
    if (!text.trim()) continue;
    messages.push({ id: m.uuid || `${c.uuid}:${i++}`, role: m.sender === 'assistant' ? 'assistant' : 'user', at: toMs(m.created_at), text });
  }
  return {
    source: 'claude-export',
    externalId: c.uuid || titleFrom(c.name),
    title: c.name || titleFrom(messages[0]?.text),
    cwd: null, model: null,
    createdAt: toMs(c.created_at) || messages[0]?.at || 0,
    updatedAt: toMs(c.updated_at) || messages.at(-1)?.at || 0,
    messages, meta: { export: 'claude' },
  };
}
