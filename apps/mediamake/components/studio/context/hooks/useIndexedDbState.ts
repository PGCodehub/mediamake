import { useState, useCallback, useRef, useEffect } from 'react';

export const IS_BROWSER = typeof window !== 'undefined';
export const SUPPORTED = IS_BROWSER && 'indexedDB' in window;

const DB_NAME = 'MediaMakeAppState';
const DB_VERSION = 1;
const STORE_NAME = 'appState';

type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);

// Connection pool to manage database connections
class IndexedDBConnectionPool {
  private static instance: IndexedDBConnectionPool;
  private connections: Map<string, IDBDatabase> = new Map();
  private pendingConnections: Map<string, Promise<IDBDatabase>> = new Map();

  static getInstance(): IndexedDBConnectionPool {
    if (!IndexedDBConnectionPool.instance) {
      IndexedDBConnectionPool.instance = new IndexedDBConnectionPool();
    }
    return IndexedDBConnectionPool.instance;
  }

  async getConnection(dbName: string, version: number): Promise<IDBDatabase> {
    const key = `${dbName}_${version}`;

    // Return existing connection if available and not closed
    if (this.connections.has(key)) {
      const connection = this.connections.get(key)!;
      try {
        // Test if connection is still open by trying to access a property
        connection.objectStoreNames;
        return connection;
      } catch (error) {
        // Connection is closed, remove it
        this.connections.delete(key);
      }
    }

    // Return pending connection if exists
    if (this.pendingConnections.has(key)) {
      return this.pendingConnections.get(key)!;
    }

    // Create new connection
    const connectionPromise = this.createConnection(dbName, version);
    this.pendingConnections.set(key, connectionPromise);

    try {
      const connection = await connectionPromise;
      this.connections.set(key, connection);
      this.pendingConnections.delete(key);

      // Set up connection cleanup on close
      connection.addEventListener('close', () => {
        this.connections.delete(key);
      });

      return connection;
    } catch (error) {
      this.pendingConnections.delete(key);
      throw error;
    }
  }

  private createConnection(
    dbName: string,
    version: number,
  ): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!SUPPORTED) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(dbName, version);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  closeConnection(dbName: string, version: number): void {
    const key = `${dbName}_${version}`;
    const connection = this.connections.get(key);
    if (connection) {
      try {
        connection.close();
      } catch (error) {
        // Connection might already be closed
      }
    }
    this.connections.delete(key);
  }

  closeAllConnections(): void {
    for (const [key, connection] of this.connections) {
      try {
        connection.close();
      } catch (error) {
        // Connection might already be closed
      }
    }
    this.connections.clear();
  }
}

// IndexedDB utility functions with connection pooling
const connectionPool = IndexedDBConnectionPool.getInstance();

const openDB = (): Promise<IDBDatabase> => {
  return connectionPool.getConnection(DB_NAME, DB_VERSION);
};

const getFromIndexedDB = async <S>(
  key: string,
  retries = 3,
): Promise<S | null> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const db = await openDB();

      // Check if database is still open by testing access
      try {
        db.objectStoreNames;
      } catch (error) {
        throw new Error('Database connection is not open');
      }

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
      });
    } catch (error) {
      console.warn(
        `Failed to get from IndexedDB (attempt ${attempt + 1}/${retries}):`,
        error,
      );

      if (attempt === retries - 1) {
        return null;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
  return null;
};

const setToIndexedDB = async <S>(
  key: string,
  value: S,
  retries = 3,
): Promise<void> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const db = await openDB();

      // Check if database is still open by testing access
      try {
        db.objectStoreNames;
      } catch (error) {
        throw new Error('Database connection is not open');
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.put({ key, value });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn(
        `Failed to set to IndexedDB (attempt ${attempt + 1}/${retries}):`,
        error,
      );

      if (attempt === retries - 1) {
        return;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
};

const removeFromIndexedDB = async (key: string, retries = 3): Promise<void> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const db = await openDB();

      // Check if database is still open by testing access
      try {
        db.objectStoreNames;
      } catch (error) {
        throw new Error('Database connection is not open');
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn(
        `Failed to remove from IndexedDB (attempt ${attempt + 1}/${retries}):`,
        error,
      );

      if (attempt === retries - 1) {
        return;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
};

const useIndexedDbState = <S>(
  key: string,
  defaultValue: S | (() => S),
): [S, Dispatch<SetStateAction<S>>, () => void] => {
  const [value, setValue] = useState<S>(() => {
    const isCallable = (value: unknown): value is () => S =>
      typeof value === 'function';
    return isCallable(defaultValue) ? defaultValue() : defaultValue;
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const lastValue = useRef(value);
  lastValue.current = value;

  // Load initial value from IndexedDB
  useEffect(() => {
    if (!SUPPORTED || isInitialized) return;

    const loadInitialValue = async () => {
      try {
        const storedValue = await getFromIndexedDB<S>(key);
        if (storedValue !== null) {
          setValue(storedValue);
        }
      } catch (error) {
        console.warn('Failed to load initial value from IndexedDB:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadInitialValue();
  }, [key, isInitialized]);

  const setIndexedDbStateValue = useCallback(
    async (newValue: SetStateAction<S>) => {
      const isCallable = (value: unknown): value is (prevState: S) => S =>
        typeof value === 'function';
      const toStore = isCallable(newValue)
        ? newValue(lastValue.current)
        : newValue;

      setValue(toStore);

      if (SUPPORTED) {
        try {
          await setToIndexedDB(key, toStore);
        } catch (error) {
          console.warn('Failed to persist to IndexedDB:', error);
        }
      }
    },
    [key],
  );

  const reset = useCallback(async () => {
    const isCallable = (value: unknown): value is (prevState: S) => S =>
      typeof value === 'function';
    const toStore = isCallable(defaultValue) ? defaultValue() : defaultValue;

    setValue(toStore);

    if (SUPPORTED) {
      try {
        await removeFromIndexedDB(key);
      } catch (error) {
        console.warn('Failed to remove from IndexedDB:', error);
      }
    }
  }, [defaultValue, key]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't close the connection here as it might be used by other components
      // The connection pool will handle cleanup automatically
    };
  }, []);

  return [value, setIndexedDbStateValue, reset];
};

export default useIndexedDbState;
