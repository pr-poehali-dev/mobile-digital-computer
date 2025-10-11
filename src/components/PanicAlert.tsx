import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getActivePanicAlerts, resetPanic, type Crew } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';
import { type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { canManageAccounts } from '@/lib/permissions';

interface PanicAlertProps {
  currentUser: User | null;
}

const PanicAlert = ({ currentUser }: PanicAlertProps) => {
  const [panicCrews, setPanicCrews] = useState<Crew[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const loadPanicAlerts = () => {
    const alerts = getActivePanicAlerts();
    
    if (alerts.length > panicCrews.length) {
      playAlarmSound();
      
      alerts.forEach(crew => {
        if (!panicCrews.find(c => c.id === crew.id)) {
          toast({
            title: '🚨 ТРЕВОГА!',
            description: `Экипаж ${crew.unitName} активировал кнопку паники! Местоположение: ${crew.location || 'неизвестно'}`,
            variant: 'destructive',
            duration: 10000,
          });
        }
      });
    }
    
    setPanicCrews(alerts);
    
    if (alerts.length === 0 && isPlaying) {
      stopAlarmSound();
    }
  };

  useSync(['crews_updated'], loadPanicAlerts, 1000);

  const playAlarmSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      
      let isHigh = true;
      const interval = setInterval(() => {
        if (audioRef.current) {
          oscillator.frequency.setValueAtTime(isHigh ? 600 : 800, audioContext.currentTime);
          isHigh = !isHigh;
        } else {
          clearInterval(interval);
          oscillator.stop();
        }
      }, 500);
    }
    setIsPlaying(true);
  };

  const stopAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleResetPanic = (crew: Crew) => {
    if (!currentUser) return;
    
    if (!canManageAccounts(currentUser)) {
      toast({
        title: 'Недостаточно прав',
        description: 'Только диспетчер или выше может сбросить тревогу',
        variant: 'destructive',
      });
      return;
    }
    
    resetPanic(crew.id, currentUser.id);
    toast({
      title: 'Тревога сброшена',
      description: `Сигнал тревоги для экипажа ${crew.unitName} сброшен`,
    });
  };

  if (panicCrews.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {panicCrews.map(crew => (
        <Card key={crew.id} className="border-red-600 border-2 bg-red-50 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Icon name="AlertTriangle" size={32} className="text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg">🚨 ТРЕВОГА!</h3>
                <p className="text-sm text-red-800 font-semibold mt-1">
                  Экипаж: {crew.unitName}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  📍 Местоположение: {crew.location || 'неизвестно'}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Активировано: {crew.panicTriggeredAt ? new Date(crew.panicTriggeredAt).toLocaleTimeString('ru-RU') : ''}
                </p>
                
                {currentUser && canManageAccounts(currentUser) && (
                  <Button
                    onClick={() => handleResetPanic(crew)}
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full border-red-600 text-red-700 hover:bg-red-100"
                  >
                    <Icon name="XCircle" size={16} className="mr-2" />
                    Сбросить тревогу
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PanicAlert;
