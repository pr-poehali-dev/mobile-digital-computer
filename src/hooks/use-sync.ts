import { useEffect } from 'react';
import { syncManager, type SyncEventType } from '@/lib/sync-manager';

/**
 * Хук для синхронизации данных между вкладками
 * @param events - массив событий для отслеживания
 * @param callback - функция обратного вызова при изменениях
 * @param interval - опциональный интервал для дополнительной проверки (мс)
 */
export const useSync = (events: SyncEventType[], callback: () => void, interval?: number) => {
  useEffect(() => {
    callback();

    const unsubscribers = events.map(event => syncManager.subscribe(event, callback));
    
    let intervalId: NodeJS.Timeout | undefined;
    if (interval) {
      intervalId = setInterval(callback, interval);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
};
