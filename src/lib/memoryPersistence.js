import { supabase } from '../supabaseClient';

const getMemoriesStorageKey = (userId) => `saved-memories-${String(userId || 'guest').trim() || 'guest'}`;
const MEMORIES_DB_NAME = 'our-calendar-memories-db';
const MEMORIES_STORE_NAME = 'memories';

export const USER_MEMORIES_TABLE = 'user_memories';
export const USER_QUICK_THOUGHTS_TABLE = 'user_quick_thoughts';
export const USER_BUCKET_LIST_TABLE = 'user_bucket_list';

const openMemoriesDb = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    resolve(null);
    return;
  }
  try {
    const request = window.indexedDB.open(MEMORIES_DB_NAME, 1);
    request.onerror = () => reject(request.error || new Error('Could not open memories database.'));
    request.onsuccess = () => resolve(request.result || null);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEMORIES_STORE_NAME)) {
        db.createObjectStore(MEMORIES_STORE_NAME);
      }
    };
  } catch (error) {
    reject(error);
  }
});

export const readMemoriesIndexedDb = async (userId) => {
  const key = getMemoriesStorageKey(userId);
  try {
    const db = await openMemoriesDb();
    if (!db) return [];
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(MEMORIES_STORE_NAME, 'readonly');
      const store = tx.objectStore(MEMORIES_STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error || new Error('Could not read memories.'));
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
};

export const writeMemoriesIndexedDb = async (userId, memories) => {
  const key = getMemoriesStorageKey(userId);
  try {
    const db = await openMemoriesDb();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MEMORIES_STORE_NAME, 'readwrite');
      const store = tx.objectStore(MEMORIES_STORE_NAME);
      const request = store.put(Array.isArray(memories) ? memories : [], key);
      request.onerror = () => reject(request.error || new Error('Could not write memories.'));
      request.onsuccess = () => resolve();
    });
    db.close();
  } catch {}
};

export const readMemoriesState = (userId) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getMemoriesStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeMemoriesState = (userId, memories) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getMemoriesStorageKey(userId), JSON.stringify(Array.isArray(memories) ? memories : []));
  } catch {}
};

export const persistMemoriesState = (userId, memories) => {
  writeMemoriesState(userId, memories);
  void writeMemoriesIndexedDb(userId, memories);
};

const getMemoriesTombstonesKey = (userId) => `memories-deleted-${String(userId || 'guest').trim() || 'guest'}`;

export const readMemoriesTombstones = (userId) => {
  if (typeof window === 'undefined') return new Set();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getMemoriesTombstonesKey(userId)) || '[]');
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

export const addMemoryTombstone = (userId, id) => {
  if (typeof window === 'undefined' || !id) return;
  try {
    const existing = readMemoriesTombstones(userId);
    existing.add(String(id));
    window.localStorage.setItem(getMemoriesTombstonesKey(userId), JSON.stringify([...existing]));
  } catch {}
};

export const mergePersistedMemories = (...memoryLists) => {
  const byKey = new Map();
  memoryLists.forEach((list) => {
    (Array.isArray(list) ? list : []).forEach((memory, index) => {
      if (!memory || typeof memory !== 'object') return;
      const idKey = String(memory?.id || '').trim();
      const fallbackKey = [
        String(memory?.date || '').trim(),
        String(memory?.title || '').trim().toLowerCase(),
        String(
          memory?.coverPhoto
          || memory?.photos?.[0]?.url
          || memory?.photos?.[0]?.photoUrl
          || memory?.photoUrl
          || memory?.photo_url
          || ''
        ).trim(),
        index,
      ].join('|');
      const key = idKey || fallbackKey;
      if (!key) return;
      byKey.set(key, memory);
    });
  });
  return Array.from(byKey.values()).sort(
    (a, b) => Number(new Date(b?.date || b?.createdAt || 0)) - Number(new Date(a?.date || a?.createdAt || 0)),
  );
};

export const getPersonalMemoryOwnerId = (userId) => String(userId || 'guest').trim() || 'guest';

export const getMemoryPrimaryPhotoUrl = (memory) => String(
  memory?.coverPhoto
  || memory?.photos?.[0]?.url
  || memory?.photos?.[0]?.photoUrl
  || memory?.photoUrl
  || memory?.photo_url
  || ''
).trim();

export const stampMemoryOwner = (memory, userId) => {
  if (!memory || typeof memory !== 'object') return memory;
  const fallbackOwnerId = getPersonalMemoryOwnerId(userId);
  const existingOwnerId = String(memory?.ownerUserId || memory?.createdByUserId || '').trim();
  const ownerUserId = existingOwnerId || fallbackOwnerId;
  return {
    ...memory,
    ownerUserId,
    createdByUserId: String(memory?.createdByUserId || ownerUserId).trim() || ownerUserId,
  };
};

const toRemoteMemoryRow = (memory, userId) => {
  if (!memory || typeof memory !== 'object') return null;
  const ownerUserId = getPersonalMemoryOwnerId(userId);
  if (!ownerUserId || ownerUserId === 'guest') return null;
  const stampedMemory = stampMemoryOwner(memory, ownerUserId);
  const id = String(stampedMemory?.id || '').trim();
  if (!id) return null;
  const rawMemoryDate = String(stampedMemory?.date || '').trim().slice(0, 10);
  const memoryDate = /^\d{4}-\d{2}-\d{2}$/.test(rawMemoryDate) ? rawMemoryDate : null;
  return {
    owner_user_id: ownerUserId,
    id,
    memory: stampedMemory,
    memory_date: memoryDate,
    created_at: String(stampedMemory?.createdAt || '').trim() || new Date().toISOString(),
    updated_at: String(stampedMemory?.updatedAt || '').trim() || new Date().toISOString(),
  };
};

const fromRemoteMemoryRow = (row, userId) => {
  if (!row || typeof row !== 'object') return null;
  const rowMemory = row?.memory && typeof row.memory === 'object' ? row.memory : {};
  return stampMemoryOwner({
    ...rowMemory,
    id: String(rowMemory?.id || row?.id || '').trim(),
    date: String(rowMemory?.date || row?.memory_date || '').trim(),
    createdAt: String(rowMemory?.createdAt || row?.created_at || '').trim(),
    updatedAt: String(rowMemory?.updatedAt || row?.updated_at || '').trim(),
  }, row?.owner_user_id || userId);
};

export const readRemoteQuickThoughtsState = async (userId) => {
  const ownerUserId = String(userId || '').trim();
  if (!ownerUserId || ownerUserId === 'guest') return [];
  try {
    const { data, error } = await supabase
      .from(USER_QUICK_THOUGHTS_TABLE)
      .select('thoughts')
      .eq('owner_user_id', ownerUserId)
      .maybeSingle();
    if (error) throw error;
    return Array.isArray(data?.thoughts) ? data.thoughts : [];
  } catch {
    return [];
  }
};

export const persistRemoteQuickThoughtsState = async (userId, thoughts) => {
  const ownerUserId = String(userId || '').trim();
  if (!ownerUserId || ownerUserId === 'guest') return;
  try {
    await supabase
      .from(USER_QUICK_THOUGHTS_TABLE)
      .upsert({
        owner_user_id: ownerUserId,
        thoughts: Array.isArray(thoughts) ? thoughts : [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_user_id' });
  } catch {}
};

export const readRemoteBucketListState = async (userId) => {
  const ownerUserId = String(userId || '').trim();
  if (!ownerUserId || ownerUserId === 'guest') return [];
  try {
    const { data, error } = await supabase
      .from(USER_BUCKET_LIST_TABLE)
      .select('dreams')
      .eq('owner_user_id', ownerUserId)
      .maybeSingle();
    if (error) throw error;
    return Array.isArray(data?.dreams) ? data.dreams : [];
  } catch {
    return [];
  }
};

export const persistRemoteBucketListState = async (userId, dreams) => {
  const ownerUserId = String(userId || '').trim();
  if (!ownerUserId || ownerUserId === 'guest') return;
  try {
    await supabase
      .from(USER_BUCKET_LIST_TABLE)
      .upsert({
        owner_user_id: ownerUserId,
        dreams: Array.isArray(dreams) ? dreams : [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_user_id' });
  } catch {}
};

export const readRemoteMemoriesState = async (userId) => {
  const ownerUserId = getPersonalMemoryOwnerId(userId);
  if (!ownerUserId || ownerUserId === 'guest') return [];
  try {
    const { data, error } = await supabase
      .from(USER_MEMORIES_TABLE)
      .select('id, owner_user_id, memory, memory_date, created_at, updated_at')
      .eq('owner_user_id', ownerUserId)
      .order('memory_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? data : [])
      .map((row) => fromRemoteMemoryRow(row, ownerUserId))
      .filter(Boolean);
  } catch (error) {
    console.warn('Could not load remote memories; using local memories only.', error?.message || error);
    return [];
  }
};

export const persistRemoteMemoriesState = async (userId, memories) => {
  const rows = (Array.isArray(memories) ? memories : [])
    .map((memory) => toRemoteMemoryRow(memory, userId))
    .filter(Boolean);
  if (rows.length === 0) return;
  try {
    const { error } = await supabase
      .from(USER_MEMORIES_TABLE)
      .upsert(rows, { onConflict: 'owner_user_id,id' });
    if (error) throw error;
  } catch (error) {
    console.warn('Could not sync memories remotely.', error?.message || error);
  }
};

export const persistRemoteMemory = async (userId, memory) => {
  const row = toRemoteMemoryRow(memory, userId);
  if (!row) return;
  try {
    const { error } = await supabase
      .from(USER_MEMORIES_TABLE)
      .upsert(row, { onConflict: 'owner_user_id,id' });
    if (error) throw error;
  } catch (error) {
    console.warn('Could not sync memory remotely.', error?.message || error);
  }
};

export const deleteRemoteMemory = async (userId, memoryId) => {
  const ownerUserId = getPersonalMemoryOwnerId(userId);
  const id = String(memoryId || '').trim();
  if (!ownerUserId || ownerUserId === 'guest' || !id) return;
  try {
    const { error } = await supabase
      .from(USER_MEMORIES_TABLE)
      .delete()
      .eq('owner_user_id', ownerUserId)
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.warn('Could not delete remote memory.', error?.message || error);
  }
};
