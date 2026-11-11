import fs from 'node:fs';
import path from 'node:path';
import { HOME, exists, walk, textOf, titleFrom, toMs, fileMtime, hash } from '../util.mjs';

export const id = 'grokbot';
export const name = 'Grok Bot';
export const docs = 'https://grokbot.ai';

export function detect() {
  const appdata = process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming');
  const base = path.join(appdata, 'Grok Bot', 'sand-client-persistence');
  return exists(base) ? [{ path: base, label: '%APPDATA%/Grok Bot/sand-client-persistence' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.blob'))) {
      if (fileMtime(fp) < since) continue;
      let o;
      try { o = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { continue; }
      const entries = o?.value?.entries;
      if (!Array.isArray(entries) || entries.length < 2) continue;
      const key = `${path.basename(fp, '.blob').slice(0, 16)}-${hash(fp).slice(0, 6)}`;
      const conv = {
        source: id, externalId: key, title: '', cwd: null, model: null,
        createdAt: fileMtime(fp), updatedAt: fileMtime(fp), messages: [], meta: { file: fp },
      };
      let i = 0;
      for (const e of entries) {
        if (!e || typeof e !== 'object') continue;
        let role = null;
        let text = '';
        if (e.kind === 'send-message') {
          role = 'user';
          text = textOf(e.message?.content ?? e.message);
        } else if (e.kind === 'message') {
          role = e.role || 'assistant';
          text = typeof e.content === 'string' ? e.content : textOf(e.content);
        } else continue;
        if (!text.trim()) continue;
        const at = toMs(e.timestampMs) || conv.updatedAt;
        if (!conv.title && role === 'user') conv.title = titleFrom(text);
        conv.createdAt = Math.min(conv.createdAt, at);
        conv.updatedAt = Math.max(conv.updatedAt, at);
        conv.messages.push({ id: String(e.id || `${key}:${i++}`), role, at, text });
      }
      if (conv.messages.length) out.push(conv);
    }
  }
  return out;
}
