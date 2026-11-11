import path from 'node:path';
import { HOME, exists, walk, jsonl, textOf, titleFrom, toMs, fileMtime, hash } from '../util.mjs';

export const id = 'workbuddy';
export const name = 'WorkBuddy / CodeBuddy';
export const docs = 'https://www.codebuddy.ai';

export function detect() {
  const dirs = [path.join(HOME, '.workbuddy', 'projects'), path.join(HOME, '.codebuddy', 'projects')];
  return dirs.filter(exists).map((p) => ({ path: p, label: p.replace(HOME, '~') }));
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.jsonl'))) {
      if (fileMtime(fp) < since) continue;
      const key = `${path.basename(fp, '.jsonl')}-${hash(fp).slice(0, 8)}`;
      const conv = {
        source: id, externalId: key, title: '', cwd: null, model: null,
        createdAt: fileMtime(fp), updatedAt: fileMtime(fp), messages: [], meta: { file: fp },
      };
      let i = 0;
      for (const o of jsonl(fp)) {
        i++;
        if (o.cwd) conv.cwd = o.cwd;
        let role = null;
        let text = '';
        if (o.type === 'message') {
          role = o.role || 'user';
          text = textOf(o.content);
        } else if (o.type === 'reasoning') {
          role = 'assistant';
          text = textOf(o.content);
        } else {
          continue;
        }
        if (!text.trim()) continue;
        const at = toMs(o.timestamp) || conv.updatedAt;
        if (!conv.title && role === 'user') conv.title = titleFrom(text);
        conv.createdAt = Math.min(conv.createdAt, at);
        conv.updatedAt = Math.max(conv.updatedAt, at);
        conv.messages.push({ id: String(o.id || `${key}:${i}`), role, kind: o.type === 'reasoning' ? 'reasoning' : null, at, text });
      }
      if (conv.messages.length) out.push(conv);
    }
  }
  return out;
}
