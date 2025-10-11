import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getActivePanicAlerts, resetPanic, getUserCrew, type Crew } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';
import { type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { canManageAccounts } from '@/lib/permissions';

interface PanicAlertProps {
  currentUser: User | null;
}

const PanicAlert = ({ currentUser }: PanicAlertProps) => {
  const [myCrewPanic, setMyCrewPanic] = useState<Crew | null>(null);
  const audioRef = useRef<{ oscillator: OscillatorNode; context: AudioContext; interval: NodeJS.Timeout } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const { toast } = useToast();

  const loadPanicAlerts = () => {
    if (!currentUser) return;
    
    const myCrew = getUserCrew(currentUser.id);
    
    if (myCrew?.panicActive) {
      if (!myCrewPanic) {
        playAlarmSound();
        setShowAlert(true);
        
        setTimeout(() => {
          setShowAlert(false);
        }, 10000);
        
        toast({
          title: '🚨 ТРЕВОГА!',
          description: `Ваш экипаж ${myCrew.unitName} активировал кнопку паники!`,
          variant: 'destructive',
          duration: 10000,
        });
      }
      setMyCrewPanic(myCrew);
    } else {
      if (myCrewPanic && isPlaying) {
        stopAlarmSound();
      }
      setMyCrewPanic(null);
      setShowAlert(false);
    }
  };

  useSync(['crews_updated'], loadPanicAlerts, 1000);

  const playAlarmSound = () => {
    if (!audioRef.current) {
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
        oscillator.frequency.setValueAtTime(isHigh ? 600 : 800, audioContext.currentTime);
        isHigh = !isHigh;
      }, 250);
      
      audioRef.current = { oscillator, context: audioContext, interval };
      
      setTimeout(() => {
        stopAlarmSound();
      }, 3000);
    }
    setIsPlaying(true);
  };

  const stopAlarmSound = () => {
    if (audioRef.current) {
      clearInterval(audioRef.current.interval);
      audioRef.current.oscillator.stop();
      audioRef.current.context.close();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  if (!myCrewPanic || !showAlert) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card 
        className="border-red-600 border-2 bg-red-50 animate-pulse"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" size={32} className="text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-lg">🚨 ТРЕВОГА АКТИВНА!</h3>
              <p className="text-sm text-red-800 font-semibold mt-1">
                Экипаж: {myCrewPanic.unitName}
              </p>
              <p className="text-sm text-red-700 mt-1">
                📍 Местоположение: {myCrewPanic.location || 'неизвестно'}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Активировано: {myCrewPanic.panicTriggeredAt ? new Date(myCrewPanic.panicTriggeredAt).toLocaleTimeString('ru-RU') : ''}
              </p>
              <p className="text-xs text-red-500 mt-2">
                Диспетчер уведомлен. Ожидайте помощи.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PanicAlert;