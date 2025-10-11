import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { getUserShiftSession, startShift, startBreak, endShift, updateShiftHeartbeat, type ShiftSession } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';
import { useToast } from '@/hooks/use-toast';

interface ShiftControlsProps {
  currentUser: User;
}

const ShiftControls = ({ currentUser }: ShiftControlsProps) => {
  const [session, setSession] = useState<ShiftSession | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();

  const loadSession = () => {
    const userSession = getUserShiftSession(currentUser.id);
    setSession(userSession);
  };

  useEffect(() => {
    loadSession();
  }, [currentUser.id]);

  useSync(['shift_sessions_updated'], () => {
    loadSession();
  }, 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      if (session && session.status !== 'off-shift' && session.currentSessionStart) {
        const elapsed = Date.now() - new Date(session.currentSessionStart).getTime();
        setCurrentTime(elapsed);
        updateShiftHeartbeat(currentUser.id);
      } else {
        setCurrentTime(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, currentUser.id]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (ms: number): string => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}ч ${minutes}м`;
  };

  const handleStartShift = () => {
    startShift(currentUser.id);
    toast({
      title: 'Смена начата',
      description: 'Время работы начало учитываться',
      className: 'bg-success text-white'
    });
  };

  const handleStartBreak = () => {
    startBreak(currentUser.id);
    toast({
      title: 'Перерыв начат',
      description: 'Время перерыва начало учитываться',
      className: 'bg-warning text-white'
    });
  };

  const handleEndShift = () => {
    endShift(currentUser.id);
    toast({
      title: 'Смена завершена',
      description: 'Данные сохранены в статистику',
      className: 'bg-muted'
    });
  };

  const isOnShift = session?.status === 'on-shift';
  const isOnBreak = session?.status === 'on-break';
  const isOffShift = !session || session.status === 'off-shift';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Clock" size={24} />
          Учёт рабочего времени
        </CardTitle>
        <CardDescription>
          Управление сменами и перерывами
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {session && session.status !== 'off-shift' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Текущий статус</p>
                <p className="text-2xl font-bold">
                  {isOnShift && '🟢 На смене'}
                  {isOnBreak && '🟡 На перерыве'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Текущая сессия</p>
                <p className="text-3xl font-mono font-bold">{formatTime(currentTime)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Всего на смене</p>
                <p className="text-lg font-semibold">{formatTotalTime(session.totalWorkTime + (isOnShift ? currentTime : 0))}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Всего на перерыве</p>
                <p className="text-lg font-semibold">{formatTotalTime(session.totalBreakTime + (isOnBreak ? currentTime : 0))}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Button
            size="lg"
            onClick={handleStartShift}
            disabled={!isOffShift}
            className="h-14"
          >
            <Icon name="Play" size={20} className="mr-2" />
            Начать смену
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleStartBreak}
            disabled={!isOnShift}
            className="h-14"
          >
            <Icon name="Coffee" size={20} className="mr-2" />
            Перерыв
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndShift}
            disabled={isOffShift}
            className="h-14"
          >
            <Icon name="StopCircle" size={20} className="mr-2" />
            Покинуть смену
          </Button>
        </div>

        {isOffShift && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Нажмите "Начать смену" чтобы начать учёт рабочего времени
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShiftControls;
