import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export const HOME = os.homedir();

export function expand(p) {
  if (!p) return p;
  if (p === '~') return HOME;
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(HOME, p.slice(2));
  return p;
}

export function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

export function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

export function walk(dir, filter, out = [], depth = 0) {
  if (depth > 10 || !exists(dir)) return out;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, filter, out, depth + 1);
    else if (filter(p, e.name)) out.push(p);
  }
  return out;
}

export function* jsonl(fp) {
  let text;
  try { text = fs.readFileSync(fp, 'utf8'); } catch { return; }
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { yield JSON.parse(s); } catch { /* skip broken line */ }
  }
}

export function parseJson(s, fallback = null) {
  try { return JSON.parse(s); } catch { return fallback; }
}

export function textOf(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(textOf).filter(Boolean).join('\n');
  if (typeof content === 'object') {
    if (typeof content.text === 'string') return content.text;
    if (typeof content.value === 'string') return content.value;
    if (content.content != null) return textOf(content.content);
    if (content.parts != null) return textOf(content.parts);
    if (content.type === 'tool_use') return `[tool] ${content.name || ''} ${JSON.stringify(content.input || {}).slice(0, 500)}`;
    if (content.type === 'tool_result') return textOf(content.content);
    if (content.type === 'function_call') return `[tool] ${content.name || ''}`;
  }
  return '';
}

const CJK = /[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/;

export function ftsText(s) {
  return String(s || '')
    .replace(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g, (m) => ` ${m} `)
    .replace(/\s+/g, ' ')
    .trim();
}

export function ftsQuery(q) {
  const s = String(q || '').trim();
  if (!s) return '""';
  if (!CJK.test(s)) return s;
  const chars = [...s.replace(/\s+/g, '')];
  return '"' + chars.join(' ') + '"';
}

export function titleFrom(text, max = 120) {
  const s = String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.slice(0, max);
}

export function hash(s) {
  return crypto.createHash('sha256').update(String(s ?? '')).digest('hex');
}

export function toMs(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v < 1e12 ? Math.round(v * 1000) : Math.round(v);
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : null;
}

export function fileMtime(fp) {
  try { return Math.round(fs.statSync(fp).mtimeMs); } catch { return 0; }
}

export function sessionIdOf(fp) {
  return path.basename(fp).replace(/\.(jsonl?|json|db|sqlite|vscdb)$/i, '');
}

export function uniqBy(arr, key) {
  const m = new Map();
  for (const x of arr) m.set(key(x), x);
  return [...m.values()];
}

const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bghp_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bBearer\s+[A-Za-z0-9._-]{20,}\b/g,
  /("?(?:api[_-]?key|token|secret|password|passwd)"?\s*[:=]\s*")[^"]{8,}(")/gi,
];

export function redactSecrets(s) {
  let out = String(s ?? '');
  for (const re of SECRET_PATTERNS) out = out.replace(re, (m, a, b) => (b !== undefined ? `${a}***${b}` : '***'));
  return out;
}
