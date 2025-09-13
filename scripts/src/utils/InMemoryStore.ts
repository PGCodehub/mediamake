import fs from 'fs';
import path from 'path';
import os from 'os';

const storeDir = path.join(os.tmpdir(), 'microfox-ai-store');

// Ensure the store directory exists
if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

class InMemoryStore {
  private getFilePath(key: string): string {
    // Basic sanitization to prevent path traversal
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(storeDir, `${safeKey}.json`);
  }

  setItem(key: string, value: any): void {
    try {
      const filePath = this.getFilePath(key);
      const serializedValue = JSON.stringify(value, null, 2); // Pretty print for readability
      fs.writeFileSync(filePath, serializedValue, 'utf8');
    } catch (error) {
      console.error(`InMemoryStore: Error setting item '${key}':`, error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        const serializedValue = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(serializedValue) as T;
      }
      return null;
    } catch (error) {
      console.error(`InMemoryStore: Error getting item '${key}':`, error);
      // Optionally delete corrupted file
      // this.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`InMemoryStore: Error removing item '${key}':`, error);
    }
  }

  clear(): void {
    try {
      const files = fs.readdirSync(storeDir);
      for (const file of files) {
        fs.unlinkSync(path.join(storeDir, file));
      }
      console.log('InMemoryStore: Cleared store.');
    } catch (error) {
      console.error('InMemoryStore: Error clearing store:', error);
    }
  }
}

// Export a singleton instance
export const inMemoryStore = new InMemoryStore();
