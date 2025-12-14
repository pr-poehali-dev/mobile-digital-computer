import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { activateSignal100, getUserCrew, isSignal100Disabled } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/use-sync';

interface Signal100ButtonProps {
  crewId: number;
  userId: string;
  crewName: string;
  disabled?: boolean;
}

const Signal100Button = ({ crewId, userId, crewName, disabled }: Signal100ButtonProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signal100TimeRemaining, setSignal100TimeRemaining] = useState<number>(0);
  const [isSignal100Active, setIsSignal100Active] = useState(false);
  const { toast } = useToast();

  const updateSignal100Timer = () => {
    const crew = getUserCrew(userId);
    if (crew?.signal100Active && crew.signal100TriggeredAt) {
      const triggeredTime = new Date(crew.signal100TriggeredAt).getTime();
      const now = Date.now();
      const elapsed = now - triggeredTime;
      const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
      setSignal100TimeRemaining(remaining);
      setIsSignal100Active(true);
    } else {
      setIsSignal100Active(false);
      setSignal100TimeRemaining(0);
    }
  };

  useSync(['crews_updated', 'signal100_changed', 'system_restrictions_changed'], updateSignal100Timer, 5000);

  useEffect(() => {
    if (isSignal100Active) {
      const interval = setInterval(updateSignal100Timer, 1000);
      return () => clearInterval(interval);
    }
  }, [isSignal100Active]);

  const handleActivateSignal100 = () => {
    if (isSignal100Disabled()) {
      setConfirmOpen(false);
      toast({
        title: 'Сигнал 100 заблокирован',
        description: 'Менеджер заблокировал возможность активации Сигнала 100',
        variant: 'destructive'
      });
      return;
    }
    
    activateSignal100(crewId, userId);
    setConfirmOpen(false);
    
    toast({
      title: '🟡 СИГНАЛ 100 АКТИВИРОВАН',
      description: `Звуковое оповещение отправлено всем экипажам и диспетчерам`,
      className: 'bg-yellow-500 text-white',
    });
  };

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || isSignal100Disabled()}
        variant={disabled ? "secondary" : "default"}
        size="sm"
        className={`w-full gap-2 font-bold ${
          disabled 
            ? 'bg-yellow-600 hover:bg-yellow-600 cursor-not-allowed text-white' 
            : isSignal100Disabled()
            ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white'
            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
        }`}
      >
        <Icon name="Radio" size={18} />
        {disabled ? (
          <span className="flex flex-col items-center leading-tight">
            <span className="text-xs">СИГНАЛ 100 АКТИВЕН</span>
            <span className="text-xs font-mono">
              ⏱️ {Math.floor(signal100TimeRemaining / 60000)}:{(Math.floor((signal100TimeRemaining % 60000) / 1000)).toString().padStart(2, '0')}
            </span>
          </span>
        ) : isSignal100Disabled() ? (
          'СИГНАЛ 100 ЗАБЛОКИРОВАН'
        ) : (
          'СИГНАЛ 100'
        )}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
              <Icon name="Radio" size={24} />
              Активация сигнала 100
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите активировать сигнал 100 для экипажа <strong>{crewName}</strong>?
              <br /><br />
              Это отправит <strong>звуковой сигнал 440 Гц</strong> всем активным экипажам и диспетчерам.
              <br />
              Сигнал будет повторяться каждые 15 секунд.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateSignal100}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Активировать сигнал
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Signal100Button;