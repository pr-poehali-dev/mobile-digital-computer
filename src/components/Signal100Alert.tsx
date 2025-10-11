import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getActiveSignal100, resetSignal100 } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';
import { useToast } from '@/hooks/use-toast';
import { canManageAccounts } from '@/lib/permissions';

interface Signal100AlertProps {
  currentUser: { id: string; fullName: string } | null;
}

const Signal100Alert = ({ currentUser }: Signal100AlertProps) => {
  const [signal100, setSignal100] = useState<ReturnType<typeof getActiveSignal100>>(null);
  const [isVisible, setIsVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const loadSignal100 = () => {
    const activeSignal = getActiveSignal100();
    setSignal100(activeSignal);
  };

  useSync(['signal100_changed'], loadSignal100, 1000);

  const playBeep = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.99);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2);
  };

  useEffect(() => {
    if (signal100?.active) {
      setIsVisible(true);
      playBeep();

      intervalRef.current = setInterval(() => {
        playBeep();
      }, 15000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsVisible(false);
    }
  }, [signal100?.active, signal100?.id]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleReset = () => {
    if (!currentUser) return;
    
    if (!canManageAccounts(currentUser)) {
      toast({
        title: 'Недостаточно прав',
        description: 'Только диспетчер или выше может отменить сигнал 100',
        variant: 'destructive',
      });
      return;
    }
    
    resetSignal100(currentUser.id);
    setIsVisible(false);
    toast({
      title: 'Сигнал 100 отменен',
      description: 'Звуковое оповещение остановлено',
    });
  };

  if (!signal100?.active || !isVisible) return null;

  const timeElapsed = Date.now() - new Date(signal100.triggeredAt).getTime();
  const timeRemaining = Math.max(0, 10 * 60 * 1000 - timeElapsed);
  const minutesRemaining = Math.floor(timeRemaining / 60000);
  const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <Card className="border-yellow-500 border-2 bg-yellow-50 animate-pulse">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Icon name="Radio" size={20} className="text-yellow-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-yellow-900 text-sm">🟡 СИГНАЛ 100</h3>
            {signal100.crewName && (
              <p className="text-xs text-yellow-800 font-semibold mt-0.5">
                Экипаж: {signal100.crewName}
              </p>
            )}
            <p className="text-xs text-yellow-700 mt-0.5">
              {signal100.triggeredByName}
            </p>
            
            {currentUser && canManageAccounts(currentUser) && (
              <Button
                onClick={handleReset}
                size="sm"
                variant="outline"
                className="mt-2 w-full border-yellow-600 text-yellow-700 hover:bg-yellow-100 h-7 text-xs"
              >
                <Icon name="RadioOff" size={14} className="mr-1" />
                Отменить
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Signal100Alert;