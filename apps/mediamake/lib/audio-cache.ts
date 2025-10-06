import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface GenericCacheDB extends DBSchema {
  httpCache: {
    key: string;
    value: {
      key: string;
      url: string;
      data: any;
      response: any;
      timestamp: number;
      etag?: string;
      lastModified?: string;
      maxAge?: number;
      expires?: number;
    };
    indexes: {
      timestamp: number;
      url: string;
    };
  };
}

class GenericHttpCache {
  private db: IDBPDatabase<GenericCacheDB> | null = null;
  private readonly DB_NAME = 'GenericHttpCache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'httpCache';
  private readonly DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<GenericCacheDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('httpCache')) {
          const store = db.createObjectStore('httpCache', {
            keyPath: 'key',
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('url', 'url');
        }
      },
    });
  }

  private generateCacheKey(url: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : '';
    return btoa(`${url}${dataStr}`).replace(/[^a-zA-Z0-9]/g, '');
  }

  private parseCacheHeaders(response: Response): {
    etag?: string;
    lastModified?: string;
    maxAge?: number;
    expires?: number;
  } {
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const cacheControl = response.headers.get('cache-control');
    const expires = response.headers.get('expires');

    let maxAge: number | undefined;
    if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        maxAge = parseInt(maxAgeMatch[1], 10) * 1000; // Convert to milliseconds
      }
    }

    let expiresTime: number | undefined;
    if (expires) {
      expiresTime = new Date(expires).getTime();
    }

    return {
      etag: etag || undefined,
      lastModified: lastModified || undefined,
      maxAge,
      expires: expiresTime,
    };
  }

  private isCacheValid(cached: any): boolean {
    const now = Date.now();

    // Check if cache has expired based on max-age
    if (cached.maxAge && now - cached.timestamp > cached.maxAge) {
      return false;
    }

    // Check if cache has expired based on expires header
    if (cached.expires && now > cached.expires) {
      return false;
    }

    // Check default cache duration
    if (!cached.maxAge && !cached.expires) {
      if (now - cached.timestamp > this.DEFAULT_CACHE_DURATION) {
        return false;
      }
    }

    return true;
  }

  async get(url: string, data?: any): Promise<any | null> {
    await this.init();
    if (!this.db) return null;

    const cacheKey = this.generateCacheKey(url, data);

    try {
      const cached = await this.db.get(this.STORE_NAME, cacheKey);

      if (!cached) return null;

      // Check if cache is still valid
      if (!this.isCacheValid(cached)) {
        await this.delete(url, data);
        return null;
      }

      return {
        ...cached.response,
        fromCache: true,
      };
    } catch (error) {
      console.warn('Error reading from cache:', error);
      return null;
    }
  }

  async set(
    url: string,
    response: any,
    data?: any,
    responseHeaders?: Headers,
  ): Promise<void> {
    await this.init();
    if (!this.db) return;

    const cacheKey = this.generateCacheKey(url, data);
    const cacheHeaders = responseHeaders
      ? this.parseCacheHeaders({ headers: responseHeaders } as Response)
      : {};

    try {
      await this.db.put(this.STORE_NAME, {
        key: cacheKey,
        url,
        data,
        response,
        timestamp: Date.now(),
        ...cacheHeaders,
      });
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }

  async delete(url: string, data?: any): Promise<void> {
    await this.init();
    if (!this.db) return;

    const cacheKey = this.generateCacheKey(url, data);

    try {
      await this.db.delete(this.STORE_NAME, cacheKey);
    } catch (error) {
      console.warn('Error deleting from cache:', error);
    }
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    try {
      await this.db.clear(this.STORE_NAME);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.init();
    if (!this.db) return;

    try {
      const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');

      const cutoff = Date.now() - this.DEFAULT_CACHE_DURATION;
      const range = IDBKeyRange.upperBound(cutoff);

      for await (const cursor of index.iterate(range)) {
        await cursor.delete();
      }

      await tx.done;
    } catch (error) {
      console.warn('Error cleaning up cache:', error);
    }
  }

  async getStats(): Promise<{ count: number; size: number }> {
    await this.init();
    if (!this.db) return { count: 0, size: 0 };

    try {
      const count = await this.db.count(this.STORE_NAME);

      // Estimate size (rough calculation)
      const all = await this.db.getAll(this.STORE_NAME);
      const size = JSON.stringify(all).length;

      return { count, size };
    } catch (error) {
      console.warn('Error getting cache stats:', error);
      return { count: 0, size: 0 };
    }
  }
}

// Singleton instance
export const httpCache = new GenericHttpCache();

// Enhanced cached fetcher that respects cache headers
export const createCachedFetcher = (
  baseFetcher: (url: string, data?: any) => Promise<Response>,
) => {
  return async (url: string, data?: any): Promise<any> => {
    // Check cache first
    const cached = await httpCache.get(url, data);
    if (cached) {
      console.log('Response served from cache');
      return cached;
    }

    // Fetch from API
    console.log('Response not in cache, fetching from API...');
    const response = await baseFetcher(url, data);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Cache the result with headers
    await httpCache.set(url, result, data, response.headers);

    return result;
  };
};
