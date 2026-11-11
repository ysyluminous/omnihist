import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { HOME, exists, parseJson, titleFrom } from '../util.mjs';

export const id = 'mausbot';
export const name = 'OpenMausBot';
export const docs = 'https://openmausbot.com';

export function detect() {
  const p = path.join(HOME, '.openmausbot', 'messages.db');
  return exists(p) ? [{ path: p, label: '~/.openmausbot/messages.db' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const dbPath of detect().map((d) => d.path)) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const rows = db.prepare('select thread_id, id, at, role, kind, text, json from messages order by at').all();
      const byThread = new Map();
      for (const r of rows) {
        let c = byThread.get(r.thread_id);
        if (!c) {
          c = {
            source: id, externalId: r.thread_id, title: '', cwd: null, model: null,
            createdAt: r.at, updatedAt: r.at, messages: [], meta: { db: dbPath },
          };
          byThread.set(r.thread_id, c);
        }
        c.createdAt = Math.min(c.createdAt, r.at);
        c.updatedAt = Math.max(c.updatedAt, r.at);
        const text = r.text || '';
        if (!text.trim()) continue;
        if (!c.title && r.role === 'user') c.title = titleFrom(text);
        c.messages.push({ id: r.id, role: r.role, kind: r.kind, at: r.at, text });
      }
      for (const c of byThread.values()) {
        if (c.updatedAt < since) continue;
        if (c.messages.length) out.push(c);
      }
    } finally {
      db.close();
    }
  }
  return out;
}
