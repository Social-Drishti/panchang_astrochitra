import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'panchang-cache';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('panchang')) {
          db.createObjectStore('panchang', { keyPath: 'cacheKey' });
        }
        if (!db.objectStoreNames.contains('transits')) {
          db.createObjectStore('transits', { keyPath: 'cacheKey' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getCachedPanchang(cacheKey: string): Promise<any | null> {
  try {
    const db = await getDb();
    const result = await db.get('panchang', cacheKey);
    if (!result) return null;
    if (Date.now() - result.timestamp > 3600_000) {
      await db.delete('panchang', cacheKey);
      return null;
    }
    return result.data;
  } catch { return null; }
}

export async function setCachedPanchang(cacheKey: string, data: any): Promise<void> {
  try {
    const db = await getDb();
    await db.put('panchang', { cacheKey, data, timestamp: Date.now() });
  } catch { /* silent */ }
}

export async function getCachedTransits(): Promise<any | null> {
  try {
    const db = await getDb();
    const result = await db.get('transits', 'latest');
    if (!result) return null;
    if (Date.now() - result.timestamp > 1800_000) {
      await db.delete('transits', 'latest');
      return null;
    }
    return result.data;
  } catch { return null; }
}

export async function setCachedTransits(data: any): Promise<void> {
  try {
    const db = await getDb();
    await db.put('transits', { cacheKey: 'latest', data, timestamp: Date.now() });
  } catch { /* silent */ }
}
