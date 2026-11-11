import fs from 'node:fs';
import path from 'node:path';
import { HOME, exists, walk, textOf, titleFrom, toMs, fileMtime } from '../util.mjs';

export const id = 'gemini-cli';
export const name = 'Gemini CLI';
export const docs = 'https://github.com/google-gemini/gemini-cli';

export function detect() {
  const base = path.join(HOME, '.gemini', 'tmp');
  return exists(base) ? [{ path: base, label: '~/.gemini/tmp' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.json'))) {
      if (fileMtime(fp) < since) continue;
      let o;
      try { o = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { continue; }
      if (!o || !Array.isArray(o.messages)) continue;
      const conv = {
        source: id, externalId: o.sessionId || path.basename(fp, '.json'),
        title: '', cwd: o.projectHash || null, model: o.model || null,
        createdAt: toMs(o.startTime) || fileMtime(fp), updatedAt: toMs(o.lastUpdated) || fileMtime(fp),
        messages: [], meta: { file: fp },
      };
      for (const m of o.messages) {
        const text = textOf(m.content);
        if (!text.trim()) continue;
        const role = m.type === 'gemini' ? 'assistant' : (m.type || 'user');
        if (!conv.title && role === 'user') conv.title = titleFrom(text);
        conv.messages.push({ id: m.id || `${conv.externalId}:${conv.messages.length}`, role, at: toMs(m.timestamp) || conv.updatedAt, text });
      }
      if (conv.messages.length) out.push(conv);
    }
  }
  return out;
}
