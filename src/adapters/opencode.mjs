import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { HOME, exists, parseJson, titleFrom } from '../util.mjs';

export const id = 'opencode';
export const name = 'opencode';
export const docs = 'https://opencode.ai';

export function detect() {
  const candidates = [
    path.join(HOME, '.local', 'share', 'opencode', 'opencode.db'),
    path.join(process.env.XDG_DATA_HOME || path.join(HOME, '.local', 'share'), 'opencode', 'opencode.db'),
  ];
  return [...new Set(candidates)].filter(exists).map((p) => ({ path: p, label: p.replace(HOME, '~') }));
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const dbPath of detect().map((d) => d.path)) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const sessions = db.prepare('select id, title, directory, model, time_created, time_updated from session').all();
      const texts = new Map();
      for (const p of db.prepare("select message_id, data from part where json_extract(data,'$.type') = 'text'").all()) {
        const d = parseJson(p.data, {});
        if (typeof d.text === 'string' && d.text.trim()) {
          const arr = texts.get(p.message_id) || [];
          arr.push(d.text);
          texts.set(p.message_id, arr);
        }
      }
      const bySession = new Map();
      for (const m of db.prepare('select id, session_id, time_created, time_updated, data from message').all()) {
        const d = parseJson(m.data, {});
        const text = (texts.get(m.id) || []).join('\n');
        const arr = bySession.get(m.session_id) || [];
        arr.push({ id: m.id, role: d.role || 'user', at: m.time_created, text, meta: { model: d.modelID, tokens: d.tokens } });
        bySession.set(m.session_id, arr);
      }
      for (const s of sessions) {
        if ((s.time_updated || 0) < since) continue;
        const messages = (bySession.get(s.id) || []).filter((m) => m.text.trim());
        if (!messages.length) continue;
        out.push({
          source: id, externalId: s.id, title: s.title || titleFrom(messages[0]?.text),
          cwd: s.directory || null, model: s.model || null,
          createdAt: s.time_created || 0, updatedAt: s.time_updated || 0,
          messages, meta: { db: dbPath },
        });
      }
    } finally {
      db.close();
    }
  }
  return out;
}
