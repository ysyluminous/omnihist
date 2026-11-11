import { adapters } from './adapters/index.mjs';
import { getCursor, saveConversations, setCursor } from './db.mjs';

export async function runSync(db, { only, full = false } = {}) {
  const results = [];
  for (const a of adapters) {
    if (only && only !== a.id) continue;
    const detected = typeof a.detect === 'function' ? a.detect() : [];
    if (!detected.length) {
      results.push({ id: a.id, name: a.name, status: 'not found' });
      continue;
    }
    const cursor = full ? 0 : getCursor(db, a.id);
    const since = cursor ? Math.max(0, cursor - 3600_000) : 0;
    const started = Date.now();
    try {
      const conversations = await a.scan({ since });
      const counts = saveConversations(db, conversations);
      const maxAt = conversations.reduce((m, c) => Math.max(m, c.updatedAt || 0), 0);
      setCursor(db, a.id, Math.max(cursor, maxAt), counts);
      results.push({ id: a.id, name: a.name, status: 'ok', ...counts, ms: Date.now() - started });
    } catch (e) {
      results.push({ id: a.id, name: a.name, status: 'error', error: e.message });
    }
  }
  return results;
}
