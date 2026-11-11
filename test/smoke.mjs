import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDb, saveConversations, search, getConversation, stats } from '../src/db.mjs';
import { ftsText, redactSecrets } from '../src/util.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnihist-'));
const db = openDb(path.join(dir, 'test.db'));

const n = saveConversations(db, [
  {
    source: 'demo', externalId: 'a', title: '缓存键怎么定',
    messages: [
      { id: 'a1', role: 'user', at: 1700000000000, text: '我们决定把协调库升级为五段流水线' },
      { id: 'a2', role: 'assistant', at: 1700000001000, text: '缓存键要带 schema version' },
    ],
  },
  {
    source: 'demo', externalId: 'b', title: 'second',
    messages: [{ id: 'b1', role: 'user', at: 1700000002000, text: 'connection pool exhausted' }],
  },
]);
assert.equal(n.conversations, 2);
assert.equal(n.messages, 3);

assert.equal(search(db, '协调库', 5).length, 1);
assert.equal(search(db, 'connection', 5).length, 1);
assert.equal(search(db, '缓存键', 5).length, 1);
assert.equal(search(db, 'nothing-here', 5).length, 0);

const got = getConversation(db, 'demo:a');
assert.equal(got.messages.length, 2);
assert.equal(got.conversation.title, '缓存键怎么定');

// idempotent
saveConversations(db, [{
  source: 'demo', externalId: 'a', title: '缓存键怎么定',
  messages: [
    { id: 'a1', role: 'user', at: 1700000000000, text: '我们决定把协调库升级为五段流水线' },
    { id: 'a2', role: 'assistant', at: 1700000001000, text: '缓存键要带 schema version' },
  ],
}]);
assert.equal(stats(db).find((r) => r.source === 'demo').messages, 3);

assert.match(ftsText('协调库'), /协 调 库/);
assert.match(redactSecrets('key sk-abcdefghijklmnopqrstuvwx'), /\*\*\*/);

db.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log('ok: save, search (zh/en), show, idempotent, redact');
