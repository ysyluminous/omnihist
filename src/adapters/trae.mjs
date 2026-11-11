import fs from 'node:fs';
import path from 'node:path';
import { HOME, exists, walk, jsonl, titleFrom, fileMtime, sessionIdOf } from '../util.mjs';

export const id = 'trae';
export const name = 'TRAE / TRAE CN / TRAE SOLO / TRAE Work';
export const docs = 'https://www.trae.ai';

/**
 * TRAE keeps its full chat in an encrypted SQLite database (ModularData/ai-chat/database.db),
 * which cannot be read without the app's key. It also writes plain-text session memories
 * (intent / actions / outcome / learned) under ~/.trae-cn/memory/projects.
 * This adapter reads the readable part and labels it as session memory.
 */
export function detect() {
  const dirs = [
    path.join(HOME, '.trae-cn', 'memory', 'projects'),
    path.join(HOME, '.trae', 'memory', 'projects'),
  ];
  return dirs.filter(exists).map((p) => ({ path: p, label: p.replace(HOME, '~') }));
}

export async function scan({ since = 0 } = {}) {
  const bySession = new Map();
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.startsWith('session_memory_') && n.endsWith('.jsonl'))) {
      if (fileMtime(fp) < since) continue;
      const sid = sessionIdOf(fp).replace(/^session_memory_/, '');
      let conv = bySession.get(sid);
      if (!conv) {
        conv = {
          source: id, externalId: sid, title: '', cwd: null, model: null,
          createdAt: fileMtime(fp), updatedAt: fileMtime(fp), messages: [],
          meta: { kind: 'session_memory', note: 'TRAE full chat DB is encrypted; this is TRAE session memory' },
        };
        bySession.set(sid, conv);
      }
      const at = fileMtime(fp);
      conv.updatedAt = Math.max(conv.updatedAt, at);
      let i = 0;
      for (const o of jsonl(fp)) {
        const intent = o.intent || o.query || o.prompt || '';
        const actions = Array.isArray(o.actions) ? o.actions : [];
        const learned = Array.isArray(o.learned) ? o.learned : [];
        const outcome = o.outcome || '';
        if (!intent && !outcome && !actions.length) continue;
        if (intent) {
          if (!conv.title) conv.title = titleFrom(intent);
          conv.messages.push({ id: `${sid}:${at}:${i++}:u`, role: 'user', at, text: intent });
        }
        const parts = [];
        if (actions.length) parts.push('actions:\n' + actions.map((a) => `- ${a}`).join('\n'));
        if (outcome) parts.push('outcome:\n' + outcome);
        if (learned.length) parts.push('learned:\n' + learned.map((a) => `- ${a}`).join('\n'));
        if (parts.length) conv.messages.push({ id: `${sid}:${at}:${i++}:a`, role: 'assistant', at, text: parts.join('\n\n') });
      }
    }
  }
  return [...bySession.values()].filter((c) => c.messages.length);
}
