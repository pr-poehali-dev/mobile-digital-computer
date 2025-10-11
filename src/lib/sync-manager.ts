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
      if (event.key && event.key.startsWith('mdc_')) {
        console.log('[SyncManager] Обнаружено изменение в localStorage:', event.key);
        // Уведомляем все подписчики о всех типах событий
        this.triggerLocalListeners('crews_updated');
        this.triggerLocalListeners('calls_updated');
        this.triggerLocalListeners('dispatcher_shift_changed');
        this.triggerLocalListeners('online_users_changed');
      }
    });
  }

  /**
   * Уведомить все вкладки и компоненты о событии
   */
  notify(eventType: SyncEventType): void {
    console.log('[SyncManager] notify вызван:', eventType);
    this.channel.postMessage({ type: eventType, timestamp: Date.now() });
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