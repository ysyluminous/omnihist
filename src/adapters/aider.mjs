import fs from 'node:fs';
import path from 'node:path';
import { HOME, exists, titleFrom, fileMtime } from '../util.mjs';

export const id = 'aider';
export const name = 'Aider';
export const docs = 'https://aider.chat';

export function detect() {
  const p = path.join(HOME, '.aider.chat.history.md');
  return exists(p) ? [{ path: p, label: '~/.aider.chat.history.md' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const fp of detect().map((d) => d.path)) {
    if (fileMtime(fp) < since) continue;
    const text = fs.readFileSync(fp, 'utf8');
    const conv = {
      source: id, externalId: `aider-${path.basename(path.dirname(fp))}`,
      title: '', cwd: null, model: null,
      createdAt: fileMtime(fp), updatedAt: fileMtime(fp), messages: [], meta: { file: fp },
    };
    let buf = [];
    let i = 0;
    const push = (role, body) => {
      body = body.trim();
      if (!body) return;
      if (!conv.title && role === 'user') conv.title = titleFrom(body);
      conv.messages.push({ id: `${conv.externalId}:${i++}`, role, at: conv.updatedAt, text: body });
    };
    for (const line of text.split('\n')) {
      if (line.startsWith('#### ')) {
        push('assistant', buf.join('\n'));
        buf = [];
        push('user', line.slice(5));
      } else if (buf.length || line.trim()) {
        buf.push(line);
      }
    }
    push('assistant', buf.join('\n'));
    if (conv.messages.length) out.push(conv);
  }
  return out;
}
