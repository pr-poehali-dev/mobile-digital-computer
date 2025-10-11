import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { activateSignal100, resetSignal100, getActiveSignal100 } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/use-sync';

interface DispatcherSignal100ControlProps {
  currentUser: { id: string; fullName: string } | null;
}

const DispatcherSignal100Control = ({ currentUser }: DispatcherSignal100ControlProps) => {
  const [signal100, setSignal100] = useState<ReturnType<typeof getActiveSignal100>>(null);
  const [activateDialog, setActivateDialog] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);
  const { toast } = useToast();

  const loadSignal100 = () => {
    setSignal100(getActiveSignal100());
  };

  useSync(['signal100_changed'], loadSignal100, 1000);

  const handleActivate = () => {
    if (!currentUser) return;
    
    activateSignal100(null, currentUser.id);
    setActivateDialog(false);
    
    toast({
      title: '🟡 СИГНАЛ 100 АКТИВИРОВАН',
      description: 'Звуковое оповещение отправлено всем экипажам',
      className: 'bg-yellow-500 text-white',
    });
  };

  const handleReset = () => {
    if (!currentUser) return;
    
    resetSignal100(currentUser.id);
    setResetDialog(false);
    
    toast({
      title: 'Сигнал 100 отменен',
      description: 'Звуковое оповещение остановлено',
    });
  };

  if (!currentUser) return null;

  return (
    <>
      {signal100?.active ? (
        <Button
          onClick={() => setResetDialog(true)}
          variant="outline"
          size="sm"
          className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
        >
          <Icon name="RadioOff" size={16} />
          Отменить сигнал 100
        </Button>
      ) : (
        <Button
          onClick={() => setActivateDialog(true)}
          size="sm"
          className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          <Icon name="Radio" size={16} />
          Сигнал 100
        </Button>
      )}

      <AlertDialog open={activateDialog} onOpenChange={setActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
              <Icon name="Radio" size={24} />
              Активация сигнала 100
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите активировать сигнал 100?
              <br /><br />
              Это отправит <strong>звуковой сигнал 440 Гц</strong> всем активным экипажам и диспетчерам.
              <br />
              Сигнал будет повторяться каждые 15 секунд в течение 10 минут.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Активировать сигнал
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetDialog} onOpenChange={setResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить сигнал 100?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отменить сигнал 100?
              <br />
              Звуковое оповещение будет остановлено для всех экипажей.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Отменить сигнал
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DispatcherSignal100Control;
