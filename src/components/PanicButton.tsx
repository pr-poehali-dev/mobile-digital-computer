import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { activatePanic, getUserCrew, isPanicButtonDisabled } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/use-sync';

interface PanicButtonProps {
  crewId: number;
  userId: string;
  crewName: string;
  disabled?: boolean;
}

const PanicButton = ({ crewId, userId, crewName, disabled }: PanicButtonProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [panicTimeRemaining, setPanicTimeRemaining] = useState<number>(0);
  const [isPanicActive, setIsPanicActive] = useState(false);
  const { toast } = useToast();

  const updatePanicTimer = () => {
    const crew = getUserCrew(userId);
    if (crew?.panicActive && crew.panicTriggeredAt) {
      const triggeredTime = new Date(crew.panicTriggeredAt).getTime();
      const now = Date.now();
      const elapsed = now - triggeredTime;
      const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
      setPanicTimeRemaining(remaining);
      setIsPanicActive(true);
    } else {
      setIsPanicActive(false);
      setPanicTimeRemaining(0);
    }
  };

  useSync(['crews_updated', 'system_restrictions_changed'], updatePanicTimer, 5000);

  useEffect(() => {
    if (isPanicActive) {
      const interval = setInterval(updatePanicTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [isPanicActive]);

  const handleActivatePanic = () => {
    if (isPanicButtonDisabled()) {
      setConfirmOpen(false);
      toast({
        title: 'Кнопка паники заблокирована',
        description: 'Менеджер заблокировал возможность нажатия кнопки паники',
        variant: 'destructive'
      });
      return;
    }
    
    activatePanic(crewId, userId);
    setConfirmOpen(false);
    
    toast({
      title: '🚨 ТРЕВОГА АКТИВИРОВАНА',
      description: `Сигнал тревоги отправлен всем экипажам и диспетчерам`,
      variant: 'destructive',
    });
  };

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || isPanicButtonDisabled()}
        variant={disabled ? "destructive" : "default"}
        size="sm"
        className={`w-full gap-2 font-bold ${
          disabled 
            ? 'bg-red-600 hover:bg-red-600 cursor-not-allowed' 
            : isPanicButtonDisabled()
            ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        <Icon name="AlertTriangle" size={18} />
        {disabled ? (
          <span className="flex flex-col items-center leading-tight">
            <span className="text-xs">ТРЕВОГА АКТИВНА</span>
            <span className="text-xs font-mono">
              ⏱️ {Math.floor(panicTimeRemaining / 60000)}:{(Math.floor((panicTimeRemaining % 60000) / 1000)).toString().padStart(2, '0')}
            </span>
          </span>
        ) : isPanicButtonDisabled() ? (
          'КНОПКА ПАНИКИ ЗАБЛОКИРОВАНА'
        ) : (
          'КНОПКА ПАНИКИ'
        )}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Icon name="AlertTriangle" size={24} />
              Активация кнопки паники
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите активировать кнопку паники для экипажа <strong>{crewName}</strong>?
              <br /><br />
              Это отправит <strong>звуковой сигнал тревоги</strong> всем активным экипажам и диспетчерам с вашим местоположением.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivatePanic}
              className="bg-red-600 hover:bg-red-700"
            >
              Активировать тревогу
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PanicButton;