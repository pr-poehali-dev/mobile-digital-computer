import { STORAGE_TYPE } from './config';

// Адаптер для работы с хранилищем (localStorage или PostgreSQL)
class StorageAdapter {
  private apiBaseUrl = '/api/storage'; // URL бэкенд функции для работы с БД

  async get<T>(key: string, defaultValue: T): Promise<T> {
    if (STORAGE_TYPE === 'localStorage') {
      return this.getFromLocalStorage(key, defaultValue);
    }
    return this.getFromDatabase(key, defaultValue);
  }

  async set(key: string, value: unknown): Promise<void> {
    if (STORAGE_TYPE === 'localStorage') {
      this.setToLocalStorage(key, value);
      return;
    }
    await this.setToDatabase(key, value);
  }

  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`[StorageAdapter] Ошибка чтения из localStorage [${key}]:`, error);
      return defaultValue;
    }
  }

  private setToLocalStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('storage-change', { detail: { key } }));
    } catch (error) {
      console.error(`[StorageAdapter] Ошибка записи в localStorage [${key}]:`, error);
    }
  }

  private async getFromDatabase<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const response = await fetch(`${this.apiBaseUrl}?key=${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.warn(`[StorageAdapter] БД вернула ошибку для ключа [${key}], используем значение по умолчанию`);
        return defaultValue;
      }

      const data = await response.json();
      return data.value !== null && data.value !== undefined ? data.value : defaultValue;
    } catch (error) {
      console.error(`[StorageAdapter] Ошибка запроса к БД [${key}]:`, error);
      return defaultValue;
    }
  }

  private async setToDatabase(key: string, value: unknown): Promise<void> {
    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        console.error(`[StorageAdapter] Не удалось сохранить в БД [${key}]`);
      } else {
        window.dispatchEvent(new CustomEvent('storage-change', { detail: { key } }));
      }
    } catch (error) {
      console.error(`[StorageAdapter] Ошибка записи в БД [${key}]:`, error);
    }
  }
}

export const storageAdapter = new StorageAdapter();
