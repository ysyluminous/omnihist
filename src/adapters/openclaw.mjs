import path from 'node:path';
import { HOME, exists, walk, jsonl, textOf, titleFrom, toMs, fileMtime, hash } from '../util.mjs';

export const id = 'openclaw';
export const name = 'OpenClaw';
export const docs = 'https://openclaw.ai';

export function detect() {
  const base = path.join(HOME, '.openclaw', 'agents');
  return exists(base) ? [{ path: base, label: '~/.openclaw/agents' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.jsonl') && p.includes(`${path.sep}sessions${path.sep}`))) {
      if (fileMtime(fp) < since) continue;
      const key = `${path.basename(fp, '.jsonl')}-${hash(fp).slice(0, 6)}`;
      const conv = { source: id, externalId: key, title: '', cwd: null, model: null, createdAt: fileMtime(fp), updatedAt: fileMtime(fp), messages: [], meta: { file: fp } };
      let i = 0;
      for (const o of jsonl(fp)) {
        i++;
        if (o.type !== 'message' || !o.message) continue;
        const text = textOf(o.message.content);
        if (!text.trim()) continue;
        const role = o.message.role || 'user';
        const at = toMs(o.timestamp) || toMs(o.message.timestamp) || conv.updatedAt;
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
