import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { HOME, ftsText, hash, redactSecrets } from './util.mjs';

const MAX_CHARS = Number(process.env.OMNIHIST_MAX_CHARS || 200000);
const REDACT = process.env.OMNIHIST_REDACT !== '0';

export const DEFAULT_DB = path.join(HOME, '.omnihist', 'omnihist.db');

export function openDb(file = DEFAULT_DB) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('pragma journal_mode = wal');
  db.exec('pragma synchronous = normal');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    create table if not exists conversation (
      id text primary key,
      source text not null,
      external_id text not null,
      title text,
      project text,
      cwd text,
      model text,
      created_at integer,
      updated_at integer,
      meta text,
      unique (source, external_id)
    );
    create index if not exists conversation_source_idx on conversation(source);
    create index if not exists conversation_updated_idx on conversation(updated_at desc);

    create table if not exists message (
      id integer primary key autoincrement,
      conversation_id text not null references conversation(id) on delete cascade,
      external_id text not null,
      seq integer,
      role text,
      kind text,
      created_at integer,
      text text,
      fts_text text,
      content_hash text,
      meta text,
      unique (conversation_id, external_id)
    );
    create index if not exists message_conv_idx on message(conversation_id, seq);
    create index if not exists message_created_idx on message(created_at desc);

    create virtual table if not exists message_fts using fts5(
      fts_text,
      content='message',
      content_rowid='id',
      tokenize='unicode61'
    );

    create trigger if not exists message_ai after insert on message begin
      insert into message_fts(rowid, fts_text) values (new.id, new.fts_text);
    end;
    create trigger if not exists message_ad after delete on message begin
      insert into message_fts(message_fts, rowid, fts_text) values ('delete', old.id, old.fts_text);
    end;
    create trigger if not exists message_au after update on message begin
      insert into message_fts(message_fts, rowid, fts_text) values ('delete', old.id, old.fts_text);
      insert into message_fts(rowid, fts_text) values (new.id, new.fts_text);
    end;

    create table if not exists sync_state (
      source text primary key,
      cursor integer,
      updated_at integer,
      stats text
    );
  `);
}

export function getCursor(db, source) {
  const row = db.prepare('select cursor from sync_state where source = ?').get(source);
  return row?.cursor ?? 0;
}

export function setCursor(db, source, cursor, stats) {
  db.prepare(`
    insert into sync_state (source, cursor, updated_at, stats) values (?, ?, ?, ?)
    on conflict(source) do update set cursor = excluded.cursor, updated_at = excluded.updated_at, stats = excluded.stats
  `).run(source, cursor || 0, Date.now(), JSON.stringify(stats || {}));
}

export function saveConversations(db, conversations) {
  if (!conversations.length) return { conversations: 0, messages: 0 };

  const upConv = db.prepare(`
    insert into conversation (id, source, external_id, title, project, cwd, model, created_at, updated_at, meta)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(id) do update set
      title = coalesce(nullif(excluded.title, ''), conversation.title),
      project = coalesce(nullif(excluded.project, ''), conversation.project),
      cwd = coalesce(nullif(excluded.cwd, ''), conversation.cwd),
      model = coalesce(nullif(excluded.model, ''), conversation.model),
      created_at = min(coalesce(conversation.created_at, excluded.created_at), excluded.created_at),
      updated_at = max(coalesce(conversation.updated_at, excluded.updated_at), excluded.updated_at),
      meta = coalesce(excluded.meta, conversation.meta)
  `);

  const upMsg = db.prepare(`
    insert into message (conversation_id, external_id, seq, role, kind, created_at, text, fts_text, content_hash, meta)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(conversation_id, external_id) do update set
      seq = excluded.seq,
      role = excluded.role,
      kind = excluded.kind,
      created_at = excluded.created_at,
      text = excluded.text,
      fts_text = excluded.fts_text,
      content_hash = excluded.content_hash,
      meta = excluded.meta
    where message.content_hash is not excluded.content_hash
  `);

  let nc = 0;
  let nm = 0;
  db.exec('begin');
  try {
    for (const c of conversations) {
      const id = `${c.source}:${c.externalId}`;
      upConv.run(
        id, c.source, String(c.externalId), c.title || '', c.project || null, c.cwd || null,
        c.model || null, c.createdAt || c.updatedAt || Date.now(), c.updatedAt || c.createdAt || Date.now(),
        c.meta ? JSON.stringify(c.meta) : null
      );
      nc++;
      let seq = 0;
      for (const m of c.messages || []) {
        let text = m.text || '';
        if (REDACT) text = redactSecrets(text);
        if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + '\n...[truncated by omnihist]';
        if (!text.trim() && !m.kind) continue;
        const ext = String(m.id || `${c.externalId}:${seq}`);
        upMsg.run(
          id, ext, m.seq ?? seq, m.role || null, m.kind || null, m.at || c.updatedAt || Date.now(),
          text, ftsText(text), hash(text), m.meta ? JSON.stringify(m.meta) : null
        );
        seq++;
        nm++;
      }
    }
    db.exec('commit');
  } catch (e) {
    db.exec('rollback');
    throw e;
  }
  return { conversations: nc, messages: nm };
}

export function search(db, query, limit = 20) {
  const q = require_fts(query);
  return db.prepare(`
    select m.id, m.role, m.created_at, c.id as conversation_id, c.source, c.title,
           snippet(message_fts, 0, '[', ']', '...', 16) as snippet
    from message_fts
    join message m on m.id = message_fts.rowid
    join conversation c on c.id = m.conversation_id
    where message_fts match ?
    order by rank
    limit ?
  `).all(q, limit);
}

function require_fts(query) {
  const s = String(query || '').trim();
  if (!s) return '""';
  const parts = s.match(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]|[A-Za-z0-9_]+/g) || [];
  if (!parts.length) return '""';
  return parts.map((t) => `"${t.replace(/"/g, '')}"`).join(' ');
}

export function listConversations(db, { source, limit = 30 } = {}) {
  if (source) {
    return db.prepare(`
      select id, source, title, cwd, model, created_at, updated_at,
             (select count(*) from message m where m.conversation_id = c.id) as messages
      from conversation c where source = ? order by updated_at desc limit ?
    `).all(source, limit);
  }
  return db.prepare(`
    select id, source, title, cwd, model, created_at, updated_at,
           (select count(*) from message m where m.conversation_id = c.id) as messages
    from conversation c order by updated_at desc limit ?
  `).all(limit);
}

export function getConversation(db, id) {
  const c = db.prepare('select * from conversation where id = ?').get(id)
    || db.prepare('select * from conversation where id like ? order by updated_at desc limit 1').get(`%${id}%`);
  if (!c) return null;
  const messages = db.prepare('select * from message where conversation_id = ? order by coalesce(seq, id), id').all(c.id);
  return { conversation: c, messages };
}

export function stats(db) {
  return db.prepare(`
    select c.source,
           count(distinct c.id) as conversations,
           count(m.id) as messages,
           sum(case when length(m.text) > 0 then 1 else 0 end) as text_messages,
           max(m.created_at) as last_at
    from conversation c left join message m on m.conversation_id = c.id
    group by c.source order by messages desc
  `).all();
}
