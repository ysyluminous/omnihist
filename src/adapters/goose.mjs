import path from 'node:path';
import { HOME, exists, walk, jsonl, textOf, titleFrom, toMs, fileMtime, hash } from '../util.mjs';

export const id = 'goose';
export const name = 'Goose';
export const docs = 'https://block.github.io/goose/';

export function detect() {
  const dirs = [
    path.join(HOME, '.local', 'share', 'goose', 'sessions'),
    path.join(process.env.APPDATA || '', 'Block', 'goose', 'data', 'sessions'),
    path.join(HOME, 'AppData', 'Roaming', 'Block', 'goose', 'data', 'sessions'),
  ];
  return [...new Set(dirs)].filter((p) => p && exists(p)).map((p) => ({ path: p, label: p.replace(HOME, '~') }));
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.jsonl'))) {
      if (fileMtime(fp) < since) continue;
      const key = `${path.basename(fp, '.jsonl')}-${hash(fp).slice(0, 6)}`;
      const conv = { source: id, externalId: key, title: '', cwd: null, model: null, createdAt: fileMtime(fp), updatedAt: fileMtime(fp), messages: [], meta: { file: fp } };
      let i = 0;
      for (const o of jsonl(fp)) {
        i++;
        const m = o.message || o;
        const text = textOf(m.content);
        if (!text.trim()) continue;
        const role = m.role || o.role || 'user';
        const at = toMs(o.timestamp || m.timestamp) || conv.updatedAt;
        if (!conv.title && role === 'user') conv.title = titleFrom(text);
        conv.createdAt = Math.min(conv.createdAt, at);
        conv.updatedAt = Math.max(conv.updatedAt, at);
        conv.messages.push({ id: String(o.id || `${key}:${i}`), role, at, text });
      }
      if (conv.messages.length) out.push(conv);
    }
  }
  return out;
}
