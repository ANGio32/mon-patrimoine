const DB_NAME = 'morphiq_exercise_videos';
const STORE  = 'videos';
const DB_VER = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveExerciseVideo(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); reject(tx.error); };
  });
}

export async function loadExerciseVideo(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => { db.close(); resolve((req.result as Blob) ?? null); };
    req.onerror   = () => { db.close(); reject(req.error); };
  });
}

export async function deleteExerciseVideo(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); reject(tx.error); };
  });
}

/** "Bodyweight Squats" → "bodyweight-squats" */
export function toExerciseId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export interface SavedVideoMeta {
  id: string;          // exercise id slug
  displayName: string; // "bodyweight-squats" → kept as-is; caller restores pretty name
  blob: Blob;
  url: string;         // object URL — caller must revoke when done
}

/** Returns all saved exercise videos from IndexedDB. */
export async function listAllExerciseVideos(): Promise<SavedVideoMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE, 'readonly');
    const store   = tx.objectStore(STORE);
    const results: SavedVideoMeta[] = [];
    const keysReq = store.getAllKeys();
    const valsReq = store.getAll();
    let keysReady = false, valsReady = false;
    let keys: IDBValidKey[] = [];
    let vals: Blob[] = [];

    keysReq.onsuccess = () => { keys = keysReq.result; keysReady = true; if (valsReady) finish(); };
    valsReq.onsuccess = () => { vals = valsReq.result as Blob[]; valsReady = true; if (keysReady) finish(); };
    keysReq.onerror = valsReq.onerror = () => { db.close(); reject(new Error('listAllExerciseVideos failed')); };

    function finish() {
      for (let i = 0; i < keys.length; i++) {
        const id = String(keys[i]);
        results.push({ id, displayName: id, blob: vals[i], url: URL.createObjectURL(vals[i]) });
      }
      db.close();
      resolve(results);
    }
  });
}
