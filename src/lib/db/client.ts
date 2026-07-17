// TrustBank360 IndexedDB Client
// Generic CRUD operations for all offline stores

import { DB_NAME, DB_VERSION, STORES, type StoreSchema } from "./schema"

let dbPromise: Promise<IDBDatabase> | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      dbPromise = null
      reject(new Error("Failed to open IndexedDB"))
    }

    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const tx = (event.target as IDBOpenDBRequest).transaction

      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store.name)) {
          const objectStore = db.createObjectStore(store.name, {
            keyPath: store.keyPath,
          })

          if (store.indexes) {
            for (const index of store.indexes) {
              objectStore.createIndex(index.name, index.keyPath, index.options)
            }
          }
        } else if (tx && store.indexes) {
          // Store exists — ensure all indexes exist (handles version upgrades
          // where new indexes are added to existing stores)
          const existingStore = tx.objectStore(store.name)
          for (const index of store.indexes) {
            if (!existingStore.indexNames.contains(index.name)) {
              existingStore.createIndex(index.name, index.keyPath, index.options)
            }
          }
        }
      }
    }
  })

  return dbPromise
}

export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
    dbPromise = null
  }
}

export async function storeRecord<T>(
  storeName: string,
  data: T
): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    const request = store.put(data)

    request.onsuccess = () => resolve(data)
    request.onerror = () => reject(new Error(`Failed to store in ${storeName}`))
    tx.oncomplete = () => resolve(data)
  })
}

export async function storeMany<T>(
  storeName: string,
  items: T[]
): Promise<T[]> {
  if (items.length === 0) return []
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)

    let completed = 0
    for (const item of items) {
      const request = store.put(item)
      request.onsuccess = () => {
        completed++
        if (completed === items.length) resolve(items)
      }
      request.onerror = () => reject(new Error(`Failed to store batch in ${storeName}`))
    }

    tx.oncomplete = () => resolve(items)
    tx.onerror = () => reject(new Error(`Transaction failed for ${storeName}`))
  })
}

export async function getRecord<T>(
  storeName: string,
  id: string
): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(new Error(`Failed to get from ${storeName}`))
  })
}

export async function getAllRecords<T>(
  storeName: string
): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error(`Failed to getAll from ${storeName}`))
  })
}

export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error(`Failed to query ${storeName} by ${indexName}`))
  })
}

export async function getFirstByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.get(value)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(new Error(`Failed to query ${storeName} by ${indexName}`))
  })
}

export async function deleteRecord(
  storeName: string,
  id: string
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`))
  })
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error(`Failed to clear ${storeName}`))
  })
}

export async function countRecords(
  storeName: string
): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error(`Failed to count ${storeName}`))
  })
}

export async function countByIndex(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.count(value)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error(`Failed to count ${storeName} by ${indexName}`))
  })
}

export async function getRecordsByRange<T>(
  storeName: string,
  indexName: string,
  lowerBound: IDBValidKey,
  upperBound: IDBValidKey,
  limit?: number
): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const range = IDBKeyRange.bound(lowerBound, upperBound)
    const request = index.getAll(range, limit)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error(`Failed to range query ${storeName}`))
  })
}

export function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "indexedDB" in window
  } catch {
    return false
  }
}
