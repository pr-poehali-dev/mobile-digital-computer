/**
 * Простой менеджер синхронизации между вкладками через localStorage
 */

type SyncEventType = 
  | 'crews_updated'
  | 'calls_updated' 
  | 'users_updated'
  | 'dispatcher_shift_changed'
  | 'online_users_changed'
  | 'activity_log_updated';

class SyncManager {
  private listeners = new Map<SyncEventType, Set<() => void>>();
  private lastSync = new Map<string, number>();

  constructor() {
    // Слушаем изменения localStorage от других вкладок
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('mdc_') && !event.key.includes('_sync_ts_')) {
        // При любом изменении данных обновляем все компоненты
        this.triggerLocalListeners('crews_updated');
        this.triggerLocalListeners('calls_updated');
        this.triggerLocalListeners('dispatcher_shift_changed');
        this.triggerLocalListeners('online_users_changed');
        this.triggerLocalListeners('activity_log_updated');
      }
    });
  }

  /**
   * Уведомить все вкладки и компоненты о событии
   */
  notify(eventType: SyncEventType): void {
    // Записываем timestamp для уведомления других вкладок
    localStorage.setItem(`mdc_sync_ts_${eventType}`, Date.now().toString());
    this.triggerLocalListeners(eventType);
  }

  /**
   * Подписаться на событие синхронизации
   */
  subscribe(eventType: SyncEventType, callback: () => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Вызвать всех слушателей события
   */
  private triggerLocalListeners(eventType: SyncEventType): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback());
    }
  }
}

export const syncManager = new SyncManager();
export type { SyncEventType };
