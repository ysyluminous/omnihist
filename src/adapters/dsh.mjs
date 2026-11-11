import fs from 'node:fs';
import path from 'node:path';
import { zstdDecompressSync } from 'node:zlib';
import { HOME, exists, walk, textOf, titleFrom, toMs, fileMtime, sessionIdOf } from '../util.mjs';

export const id = 'dsh';
export const name = 'DeepSeek Harness / DSH Desktop';
export const docs = 'https://github.com/deepseek-ai/deepseek-harness';

export function detect() {
  const base = path.join(HOME, '.dsh', 'sessions');
  return exists(base) ? [{ path: base, label: '~/.dsh/sessions' }] : [];
}

// DSH appends one zstd frame per flush, so a session file is many frames concatenated.
function readSession(fp) {
  const buf = fs.readFileSync(fp);
  if (!fp.endsWith('.zstd')) return buf.toString('utf8');
  const magic = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);
  const offs = [];
  let i = 0;
  while ((i = buf.indexOf(magic, i)) !== -1) { offs.push(i); i += 4; }
  if (!offs.length) return '';
  const parts = [];
  for (let k = 0; k < offs.length; k++) {
    const start = offs[k];
    const end = k + 1 < offs.length ? offs[k + 1] : buf.length;
    try { parts.push(zstdDecompressSync(buf.subarray(start, end)).toString('utf8')); } catch { /* skip damaged frame */ }
  }
  return parts.join('\n');
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.jsonl.zstd') || n.endsWith('.jsonl'))) {
      if (fileMtime(fp) < since) continue;
      const lines = readSession(fp).split('\n').filter(Boolean);
      let conv = null;
      let title = '';
      for (const line of lines) {
        let o;
        try { o = JSON.parse(line); } catch { continue; }
        if (o.type === 'session') {
          conv = {
            source: id, externalId: o.id || sessionIdOf(fp), title: '', cwd: o.cwd || null, model: o.agentPreset || null,
            createdAt: o.createdAt || fileMtime(fp), updatedAt: o.createdAt || fileMtime(fp),
            messages: [], meta: { file: fp },
          };
          continue;
        }
        if (!conv) {
          conv = { source: id, externalId: sessionIdOf(fp), title: '', cwd: null, model: null, createdAt: fileMtime(fp), updatedAt: fileMtime(fp), messages: [], meta: { file: fp } };
        }
        if (o.type === 'session/title' && o.data?.title) { title = o.data.title; continue; }
        let role = null;
        let text = '';
        if (o.type === 'user/message') { role = 'user'; text = textOf(o.data?.content); }
        else if (o.type === 'assistant/message') { role = 'assistant'; text = textOf(o.data?.message?.content); }
        else if (o.type === 'system/message') { role = 'system'; text = textOf(o.data?.message?.content); }
        else if (o.type === 'tool/result') { role = 'tool'; text = textOf(o.data?.message?.content); }
        else if (o.type === 'tool/call') { role = 'tool'; text = `[tool] ${o.data?.name || ''} ${String(o.data?.arguments || '').slice(0, 800)}`; }
        if (!role || !text.trim()) continue;
        const at = o.time || conv.updatedAt;
        conv.createdAt = Math.min(conv.createdAt, at);
        conv.updatedAt = Math.max(conv.updatedAt, at);
        conv.messages.push({ id: o.data?.message?.id || `${conv.externalId}:${o.seq}`, role, kind: o.type === 'tool/result' ? 'tool_result' : null, at, text });
      }
      if (conv && conv.messages.length) {
        conv.title = title || titleFrom(conv.messages.find((m) => m.role === 'user')?.text);
        out.push(conv);
      }
    }
  }
  return out;
}
