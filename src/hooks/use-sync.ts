import { useEffect } from 'react';
import { syncManager } from '@/lib/store';

export const useSync = (events: string[], callback: () => void, interval?: number) => {
  useEffect(() => {
    callback();

    const unsubscribers = events.map(event => syncManager.listen(event, callback));
    
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
