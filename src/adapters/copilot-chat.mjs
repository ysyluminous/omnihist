import fs from 'node:fs';
import path from 'node:path';
import { HOME, exists, walk, textOf, titleFrom, toMs, fileMtime } from '../util.mjs';

export const id = 'copilot-chat';
export const name = 'GitHub Copilot Chat (VS Code)';
export const docs = 'https://code.visualstudio.com/docs/copilot/overview';

export function detect() {
  const appdata = process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming');
  const base = path.join(appdata, 'Code', 'User', 'workspaceStorage');
  return exists(base) ? [{ path: base, label: '%APPDATA%/Code/User/workspaceStorage' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.json') && p.includes(`${path.sep}chatSessions${path.sep}`))) {
      if (fileMtime(fp) < since) continue;
      let o;
      try { o = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { continue; }
      if (!o || !Array.isArray(o.requests)) continue;
      const conv = {
        source: id, externalId: o.sessionId || path.basename(fp, '.json'),
        title: o.customTitle || '', cwd: null, model: o.responderUsername || null,
        createdAt: toMs(o.creationDate) || fileMtime(fp), updatedAt: toMs(o.lastMessageDate) || fileMtime(fp),
        messages: [], meta: { file: fp },
      };
      let i = 0;
      for (const r of o.requests) {
        const userText = textOf(r.message?.parts || r.message?.text || r.message);
        const at = toMs(r.timestamp) || conv.updatedAt;
        if (userText.trim()) {
          if (!conv.title) conv.title = titleFrom(userText);
          conv.messages.push({ id: `${conv.externalId}:${i++}:u`, role: 'user', at, text: userText });
        }
        const answer = (r.response || []).map((x) => x?.value ?? textOf(x)).filter(Boolean).join('\n');
        if (answer.trim()) conv.messages.push({ id: `${conv.externalId}:${i++}:a`, role: 'assistant', at, text: answer });
      }
      if (conv.messages.length) out.push(conv);
    }
  }
  return out;
}
