import { useEffect, useRef } from 'react';
import { syncManager, type SyncEventType } from '@/lib/sync-manager';

/**
 * Хук для синхронизации данных между вкладками
 * @param events - массив событий для отслеживания
 * @param callback - функция обратного вызова при изменениях
 * @param interval - интервал для polling (мс), по умолчанию 2000мс
 */
export const useSync = (events: SyncEventType[], callback: () => void, interval: number = 2000) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Первая загрузка
    callbackRef.current();

    // Подписка на события синхронизации
    const unsubscribers = events.map(event => 
      syncManager.subscribe(event, () => callbackRef.current())
    );
    
    // Принудительный polling каждые N миллисекунд
    const intervalId = setInterval(() => {
      callbackRef.current();
    }, interval);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(intervalId);
    };
  }, [events.join(','), interval]);
};
