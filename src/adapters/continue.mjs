import fs from 'node:fs';
import path from 'node:path';
import { HOME, exists, walk, textOf, titleFrom, toMs, fileMtime } from '../util.mjs';

export const id = 'continue';
export const name = 'Continue';
export const docs = 'https://continue.dev';

export function detect() {
  const base = path.join(HOME, '.continue', 'sessions');
  return exists(base) ? [{ path: base, label: '~/.continue/sessions' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.json'))) {
      if (fileMtime(fp) < since) continue;
      let o;
      try { o = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { continue; }
      if (!o || !Array.isArray(o.history)) continue;
      const conv = {
        source: id, externalId: o.sessionId || path.basename(fp, '.json'),
        title: o.title || '', cwd: o.workspaceDirectory || null, model: o.model || null,
        createdAt: toMs(o.dateCreated) || fileMtime(fp), updatedAt: toMs(o.dateUpdated) || fileMtime(fp),
        messages: [], meta: { file: fp },
      };
      let i = 0;
      for (const h of o.history) {
        const m = h.message || h;
        const text = textOf(m.content);
        if (!text.trim()) continue;
        const role = m.role || 'user';
        if (!conv.title && role === 'user') conv.title = titleFrom(text);
        conv.messages.push({ id: `${conv.externalId}:${i++}`, role, at: conv.updatedAt, text });
      }
      if (conv.messages.length) out.push(conv);
    }
  }
  return out;
}
