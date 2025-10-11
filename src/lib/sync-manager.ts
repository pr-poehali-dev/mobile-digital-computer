/**
 * Глобальный менеджер синхронизации между вкладками и компонентами
 * Использует BroadcastChannel для синхронизации между вкладками браузера
 */

type SyncEventType = 
  | 'crews_updated'
  | 'calls_updated' 
  | 'users_updated'
  | 'dispatcher_shift_changed'
  | 'online_users_changed'
  | 'activity_log_updated';

class SyncManager {
  private channel: BroadcastChannel;
  private listeners = new Map<SyncEventType, Set<() => void>>();

  constructor() {
    this.channel = new BroadcastChannel('mdc_sync_channel');
    
    this.channel.addEventListener('message', (event) => {
      const eventType = event.data.type as SyncEventType;
      console.log('[SyncManager] Получено сообщение из другой вкладки:', eventType, event.data);
      this.triggerLocalListeners(eventType);
    });

    // Резервный механизм через storage events
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('mdc_sync_')) {
        const eventType = event.key.replace('mdc_sync_', '') as SyncEventType;
        console.log('[SyncManager] Обнаружено изменение через storage:', eventType);
        this.triggerLocalListeners(eventType);
      } else if (event.key && event.key.startsWith('mdc_crews')) {
        console.log('[SyncManager] Прямое изменение mdc_crews');
        this.triggerLocalListeners('crews_updated');
      } else if (event.key && event.key.startsWith('mdc_calls')) {
        this.triggerLocalListeners('calls_updated');
      }
    });
  }

  /**
   * Уведомить все вкладки и компоненты о событии
   */
  notify(eventType: SyncEventType): void {
    console.log('[SyncManager] notify вызван:', eventType);
    this.channel.postMessage({ type: eventType, timestamp: Date.now() });
    
    // Дополнительно записываем в localStorage для гарантированной синхронизации
    const syncKey = `mdc_sync_${eventType}`;
    localStorage.setItem(syncKey, Date.now().toString());
    
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

  /**
   * Закрыть соединение
   */
  close(): void {
    this.channel.close();
  }
}

export const syncManager = new SyncManager();
export type { SyncEventType };