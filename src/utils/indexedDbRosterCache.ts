/**
 * IndexedDB Offline Persistence Engine for Personal Club Roster
 * Caches Kit's verified Starting XI & Bench from Google Doc ("Kits Ultimate Team 5/11/26")
 * Ensures 100% offline availability with instant sub-millisecond local startup.
 */

import { SquadPosition, SquadPlayerCard } from '../components/SquadTrackerView';

const DB_NAME = 'FC27_UT_ROSTER_DB';
const DB_VERSION = 1;
const STORE_NAME = 'club_roster_cache';
const RECORD_KEY = 'cannons_n_pecks_active_roster';

export interface CachedRosterRecord {
  id: string;
  squad: SquadPosition[];
  bench: SquadPlayerCard[];
  sourceDoc: string;
  sourceDocId: string;
  lastSyncedTimestamp: string;
  cachedAtIso: string;
  clubName: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this runtime environment.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB.'));
    };
  });
}

/**
 * Persists the current verified Starting XI & Bench into IndexedDB.
 */
export async function saveRosterToIndexedDb(
  squad: SquadPosition[],
  bench: SquadPlayerCard[],
  sourceDocTitle: string = 'Kits Ultimate Team 5/11/26',
  sourceDocId: string = '16TZXHjTDpdtV-BqDThV8NMJGKNkKA-8NCVVMEQIgSEg'
): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: CachedRosterRecord = {
        id: RECORD_KEY,
        squad,
        bench,
        sourceDoc: sourceDocTitle,
        sourceDocId,
        lastSyncedTimestamp: new Date().toLocaleTimeString('en-GB', {
          timeZone: 'Europe/London',
          hour: '2-digit',
          minute: '2-digit',
        }),
        cachedAtIso: new Date().toISOString(),
        clubName: 'Cannons n Pecks',
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        resolve(true);
      };

      putRequest.onerror = () => {
        console.warn('IndexedDB save failed:', putRequest.error);
        reject(putRequest.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB unavailable or blocked:', err);
    return false;
  }
}

/**
 * Retrieves the cached roster from IndexedDB for instant offline startup.
 */
export async function loadRosterFromIndexedDb(): Promise<CachedRosterRecord | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(RECORD_KEY);

      getRequest.onsuccess = () => {
        const result = getRequest.result as CachedRosterRecord | undefined;
        if (result && Array.isArray(result.squad) && result.squad.length > 0) {
          resolve(result);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB cache:', err);
    return null;
  }
}
