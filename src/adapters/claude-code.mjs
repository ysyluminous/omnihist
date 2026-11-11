import path from 'node:path';
import { HOME, exists, walk, jsonl, textOf, titleFrom, toMs, fileMtime } from '../util.mjs';

export const id = 'claude-code';
export const name = 'Claude Code';
export const docs = 'https://docs.anthropic.com/en/docs/claude-code';

export function detect() {
  const base = path.join(HOME, '.claude', 'projects');
  return exists(base) ? [{ path: base, label: '~/.claude/projects' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.jsonl'))) {
      if (fileMtime(fp) < since) continue;
      const convs = new Map();
      let i = 0;
      for (const o of jsonl(fp)) {
        i++;
        const type = o.type;
        if (type !== 'user' && type !== 'assistant') continue;
        const msg = o.message || {};
        const role = msg.role || type;
        const text = textOf(msg.content);
        if (!text.trim()) continue;
        const sid = o.sessionId || path.basename(fp, '.jsonl');
        let c = convs.get(sid);
        if (!c) {
          c = {
            source: id, externalId: sid, title: '', cwd: o.cwd || null, model: null,
            createdAt: toMs(o.timestamp) || fileMtime(fp), updatedAt: toMs(o.timestamp) || fileMtime(fp),
            messages: [], meta: { file: fp },
          };
          convs.set(sid, c);
        }
        if (!c.title && role === 'user') c.title = titleFrom(text);
        if (o.cwd) c.cwd = o.cwd;
        const at = toMs(o.timestamp) || c.updatedAt;
        c.createdAt = Math.min(c.createdAt, at);
        c.updatedAt = Math.max(c.updatedAt, at);
        c.messages.push({ id: o.uuid || `${sid}:${i}`, role, at, text });
      }
      out.push(...convs.values());
    }
  }
  return out;
}
