/**
 * Простой менеджер синхронизации между вкладками через localStorage
 */

type SyncEventType = 
  | 'crews_updated'
  | 'calls_updated' 
  | 'users_updated'
  | 'dispatcher_shift_changed'
  | 'online_users_changed'
  | 'activity_log_updated'
  | 'signal100_changed'
  | 'system_lockdown_changed'
  | 'user_settings_changed'
  | 'crew_assigned_to_call';

class SyncManager {
  private listeners = new Map<SyncEventType, Set<(data?: any) => void>>();
  private lastSync = new Map<string, number>();
  private lastEventData = new Map<SyncEventType, any>();
  private channel: BroadcastChannel;

  constructor() {
    // Используем BroadcastChannel для синхронизации между вкладками
    this.channel = new BroadcastChannel('mdc_sync');
    console.log('[SyncManager] BroadcastChannel создан');
    
    // Слушаем сообщения от других вкладок
    this.channel.onmessage = (event) => {
      const { eventType, data } = event.data;
      console.log('[SyncManager] Получено сообщение:', { eventType, data });
      
      // Сохраняем данные события
      if (data) {
        this.lastEventData.set(eventType, data);
      }
      
      // Если есть данные, обновляем localStorage
      if (data && data.key && data.value) {
        localStorage.setItem(data.key, JSON.stringify(data.value));
        console.log('[SyncManager] localStorage обновлен:', data.key);
      }
      
      // Уведомляем локальных слушателей
      this.triggerLocalListeners(eventType, data);
    };

    // Дополнительно слушаем storage event (для обратной совместимости)
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('mdc_') && !event.key.includes('_sync_ts_')) {
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
  notify(eventType: SyncEventType, data?: any): void {
    console.log('[SyncManager] Отправка сообщения:', { eventType, data });
    
    // Сохраняем данные события
    if (data) {
      this.lastEventData.set(eventType, data);
    }
    
    // Отправляем сообщение всем вкладкам через BroadcastChannel
    this.channel.postMessage({ eventType, data });
    
    // Уведомляем локальных слушателей в текущей вкладке
    this.triggerLocalListeners(eventType, data);
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
  private triggerLocalListeners(eventType: SyncEventType, data?: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Подписаться на событие (совместимость с addEventListener)
   */
  addEventListener(eventType: SyncEventType, callback: (event: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const wrappedCallback = (data?: any) => {
      // Формируем объект события в стиле DOM
      const eventData = { detail: data || this.lastEventData.get(eventType) };
      callback(eventData);
    };
    
    // Сохраняем оригинальный callback для removeEventListener
    (callback as any)._wrappedCallback = wrappedCallback;
    
    this.listeners.get(eventType)!.add(wrappedCallback);
  }

  /**
   * Отписаться от события (совместимость с removeEventListener)
   */
  removeEventListener(eventType: SyncEventType, callback: (event: any) => void): void {
    const wrappedCallback = (callback as any)._wrappedCallback;
    if (wrappedCallback) {
      this.listeners.get(eventType)?.delete(wrappedCallback);
    }
  }

  /**
   * Закрыть канал синхронизации
   */
  destroy(): void {
    this.channel.close();
  }
}

export const syncManager = new SyncManager();
export type { SyncEventType };