import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { getActiveSignal100 } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';

interface Signal100AlertProps {
  currentUser: { id: string; fullName: string } | null;
}

const Signal100Alert = ({ currentUser }: Signal100AlertProps) => {
  const [signal100, setSignal100] = useState<ReturnType<typeof getActiveSignal100>>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2);
  };

  useEffect(() => {
    if (signal100?.active) {
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

  if (!signal100?.active) return null;

  const timeElapsed = Date.now() - new Date(signal100.triggeredAt).getTime();
  const timeRemaining = Math.max(0, 10 * 60 * 1000 - timeElapsed);
  const minutesRemaining = Math.floor(timeRemaining / 60000);
  const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-5 duration-300">
      <Card className="border-2 border-yellow-500 bg-yellow-50 shadow-2xl">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center animate-pulse">
                <Icon name="Radio" size={24} className="text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-yellow-900 text-lg">🟡 СИГНАЛ 100</h3>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-900 border-yellow-500">
                  {minutesRemaining}:{secondsRemaining.toString().padStart(2, '0')}
                </Badge>
              </div>
              
              <div className="space-y-1">
                {signal100.crewName && (
                  <p className="text-sm text-yellow-900">
                    <strong>Экипаж:</strong> {signal100.crewName}
                  </p>
                )}
                <p className="text-sm text-yellow-900">
                  <strong>Активировал:</strong> {signal100.triggeredByName}
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  Звуковой сигнал 440 Гц повторяется каждые 15 секунд
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signal100Alert;
