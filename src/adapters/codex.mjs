import path from 'node:path';
import { HOME, exists, walk, jsonl, textOf, titleFrom, toMs, fileMtime, sessionIdOf } from '../util.mjs';

export const id = 'codex';
export const name = 'Codex CLI';
export const docs = 'https://github.com/openai/codex';

export function detect() {
  const dirs = [path.join(HOME, '.codex', 'sessions'), path.join(HOME, '.codex', 'archived_sessions')];
  return dirs.filter(exists).map((p) => ({ path: p, label: p.replace(HOME, '~') }));
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const base of detect().map((d) => d.path)) {
    for (const fp of walk(base, (p, n) => n.endsWith('.jsonl') || n.endsWith('.jsonl.zst'))) {
      if (fp.endsWith('.zst')) continue; // needs zstd; listed as unsupported in docs
      if (fileMtime(fp) < since) continue;
      let conv = null;
      let i = 0;
      const seen = new Set();
      for (const o of jsonl(fp)) {
        i++;
        const t = o.type;
        const p = o.payload || {};
        if (t === 'session_meta') {
          conv ||= blank(p.id || sessionIdOf(fp), p.cwd, o.timestamp, fp);
          if (p.cwd) conv.cwd = p.cwd;
          continue;
        }
        conv ||= blank(sessionIdOf(fp), null, o.timestamp, fp);
        const at = toMs(o.timestamp) || conv.updatedAt;
        if (t === 'response_item') {
          if (p.type === 'message') {
            const text = textOf(p.content);
            if (!text.trim()) continue;
            const key = p.id || `${i}`;
            if (seen.has(key)) continue;
            seen.add(key);
            push(conv, { id: key, role: p.role || 'user', at, text });
          } else if (p.type === 'function_call') {
            push(conv, { id: p.call_id || `${i}`, role: 'tool', kind: 'tool_call', at, text: `[tool] ${p.name || ''} ${String(p.arguments || '').slice(0, 800)}` });
          } else if (p.type === 'function_call_output') {
            push(conv, { id: p.call_id || `${i}`, role: 'tool', kind: 'tool_result', at, text: String(p.output || '').slice(0, 2000) });
          } else if (p.type === 'reasoning') {
            const text = textOf(p.summary || p.content);
            if (text.trim()) push(conv, { id: p.id || `${i}`, role: 'assistant', kind: 'reasoning', at, text });
          }
        } else if (t === 'event_msg' && (p.type === 'agent_message' || p.type === 'user_message')) {
          const text = p.message || p.text || '';
          if (text.trim()) push(conv, { id: p.id || `${i}`, role: p.type === 'user_message' ? 'user' : 'assistant', at, text });
        }
      }
      if (conv && conv.messages.length) out.push(conv);
    }
  }
  return out;
}

function blank(externalId, cwd, ts, fp) {
  const at = toMs(ts) || fileMtime(fp);
  return { source: id, externalId, title: '', cwd: cwd || null, model: null, createdAt: at, updatedAt: at, messages: [], meta: { file: fp } };
}

function push(c, m) {
  if (!c.title && m.role === 'user') c.title = titleFrom(m.text);
  c.createdAt = Math.min(c.createdAt, m.at);
  c.updatedAt = Math.max(c.updatedAt, m.at);
  c.messages.push(m);
}
