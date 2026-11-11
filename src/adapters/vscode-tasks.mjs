import fs from 'node:fs';
import path from 'node:path';
import { HOME, exists, walk, textOf, titleFrom, toMs, fileMtime } from '../util.mjs';

export const id = 'vscode-tasks';
export const name = 'Cline / Roo Code / Kilo Code';
export const docs = 'https://github.com/cline/cline';

const EXTENSIONS = ['saoudrizwan.claude-dev', 'rooveterinaryinc.roo-cline', 'kilocode.kilo-code'];

export function detect() {
  const appdata = process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming');
  const base = path.join(appdata, 'Code', 'User', 'globalStorage');
  const found = [];
  for (const ext of EXTENSIONS) {
    const p = path.join(base, ext);
    if (exists(p)) found.push({ path: p, label: `%APPDATA%/Code/User/globalStorage/${ext}` });
  }
  return found;
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    const ext = path.basename(base);
    for (const fp of walk(base, (p, n) => n === 'api_conversation_history.json')) {
      if (fileMtime(fp) < since) continue;
      let arr;
      try { arr = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { continue; }
      if (!Array.isArray(arr)) continue;
      const taskId = path.basename(path.dirname(fp));
      const conv = {
        source: id, externalId: `${ext}-${taskId}`, title: '', cwd: null, model: ext,
        createdAt: fileMtime(fp), updatedAt: fileMtime(fp), messages: [], meta: { file: fp, extension: ext },
      };
      let i = 0;
      for (const m of arr) {
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
