// IndexedDB utility for persisting agent form data and outputs
export interface AgentFormData {
  id: string;
  agentPath: string;
  title: string;
  formData: Record<string, any>;
  output?: any;
  timestamp: number;
}

class IndexedDBManager {
  private dbName = 'AgentFormDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('agentForms')) {
          const formStore = db.createObjectStore('agentForms', {
            keyPath: 'id',
          });
          formStore.createIndex('agentPath', 'agentPath', { unique: false });
          formStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveFormData(
    agentPath: string,
    title: string,
    formData: Record<string, any>,
    output?: any,
  ): Promise<void> {
    if (!this.db) await this.init();

    const data: AgentFormData = {
      id: `${agentPath}-${Date.now()}`,
      agentPath,
      title,
      formData,
      output,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agentForms'], 'readwrite');
      const store = transaction.objectStore('agentForms');
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLatestFormData(agentPath: string): Promise<AgentFormData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agentForms'], 'readonly');
      const store = transaction.objectStore('agentForms');
      const index = store.index('agentPath');
      const request = index.getAll(agentPath);

      request.onsuccess = () => {
        const results = request.result as AgentFormData[];
        if (results.length === 0) {
          resolve(null);
          return;
        }

        // Get the most recent entry
        const latest = results.sort((a, b) => b.timestamp - a.timestamp)[0];
        resolve(latest);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFormData(agentPath: string): Promise<AgentFormData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agentForms'], 'readonly');
      const store = transaction.objectStore('agentForms');
      const index = store.index('agentPath');
      const request = index.getAll(agentPath);

      request.onsuccess = () => {
        const results = request.result as AgentFormData[];
        resolve(results.sort((a, b) => b.timestamp - a.timestamp));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFormData(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agentForms'], 'readwrite');
      const store = transaction.objectStore('agentForms');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agentForms'], 'readwrite');
      const store = transaction.objectStore('agentForms');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbManager = new IndexedDBManager();
