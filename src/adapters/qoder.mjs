import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { HOME, exists, parseJson, titleFrom } from '../util.mjs';

export const id = 'qoder';
export const name = 'Qoder / Qoder CN';
export const docs = 'https://qoder.com';

export function detect() {
  const appdata = process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming');
  const candidates = [
    path.join(appdata, 'com.qodercn.app.stable', 'main.sqlite'),
    path.join(appdata, 'com.qoder.app.stable', 'main.sqlite'),
    path.join(appdata, 'Qoder', 'main.sqlite'),
    path.join(HOME, '.qoder-cn', 'main.sqlite'),
  ];
  return [...new Set(candidates)].filter(exists).map((p) => ({ path: p, label: p.replace(HOME, '~') }));
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const dbPath of detect().map((d) => d.path)) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const cols = db.prepare('pragma table_info(chat_session_messages)').all().map((c) => c.name);
      const roleExpr = cols.includes('role') ? 'role' : "''";
      const sessions = db.prepare('select session_id, title, cwd, model, created_at, updated_at from chat_sessions').all();
      const rows = db.prepare(`select session_id, message_id, sequence, ${roleExpr} as role, payload_json, created_at, updated_at from chat_session_messages`).all();
      const bySession = new Map();
      for (const r of rows) {
        const payload = parseJson(r.payload_json, {});
        const parts = Array.isArray(payload.parts) ? payload.parts : [];
        const text = parts.filter((p) => p.type === 'text' && typeof p.text === 'string').map((p) => p.text).join('\n');
        const thinking = parts.filter((p) => p.type === 'thinking' && typeof p.text === 'string').map((p) => p.text).join('\n');
        const role = r.role || payload.role || (String(r.message_id).startsWith('assistant') ? 'assistant' : 'user');
        const arr = bySession.get(r.session_id) || [];
        if (text.trim()) arr.push({ id: r.message_id, role, at: r.created_at, text, seq: r.sequence });
        if (thinking.trim()) arr.push({ id: `${r.message_id}:thinking`, role: 'assistant', kind: 'reasoning', at: r.created_at, text: thinking, seq: r.sequence });
        bySession.set(r.session_id, arr);
      }
      for (const s of sessions) {
        if ((s.updated_at || 0) < since) continue;
        const messages = (bySession.get(s.session_id) || []).sort((a, b) => (a.at || 0) - (b.at || 0));
        if (!messages.length) continue;
        out.push({
          source: id, externalId: s.session_id, title: s.title || titleFrom(messages.find((m) => m.role === 'user')?.text),
          cwd: s.cwd || null, model: s.model || null,
          createdAt: s.created_at || 0, updatedAt: s.updated_at || 0,
          messages, meta: { db: dbPath },
        });
      }
    } finally {
      db.close();
    }
  }
  return out;
}
