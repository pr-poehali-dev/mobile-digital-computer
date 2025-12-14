import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { getUserCrew } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/use-sync';
import { type LucideIcon } from 'lucide-react';

type EmergencyType = 'panic' | 'signal100';

interface EmergencyConfig {
  icon: string;
  activeLabel: string;
  inactiveLabel: string;
  blockedLabel: string;
  dialogTitle: string;
  dialogDescription: string;
  actionLabel: string;
  toastTitle: string;
  toastDescription: string;
  activeColor: string;
  hoverColor: string;
  dialogTitleColor: string;
  actionColor: string;
  actionHoverColor: string;
  toastClassName?: string;
}

const EMERGENCY_CONFIGS: Record<EmergencyType, EmergencyConfig> = {
  panic: {
    icon: 'AlertTriangle',
    activeLabel: 'ТРЕВОГА АКТИВНА',
    inactiveLabel: 'КНОПКА ПАНИКИ',
    blockedLabel: 'КНОПКА ПАНИКИ ЗАБЛОКИРОВАНА',
    dialogTitle: 'Активация кнопки паники',
    dialogDescription: 'Это отправит звуковой сигнал тревоги всем активным экипажам и диспетчерам с вашим местоположением.',
    actionLabel: 'Активировать тревогу',
    toastTitle: '🚨 ТРЕВОГА АКТИВИРОВАНА',
    toastDescription: 'Сигнал тревоги отправлен всем экипажам и диспетчерам',
    activeColor: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    dialogTitleColor: 'text-red-600',
    actionColor: 'bg-red-600',
    actionHoverColor: 'hover:bg-red-700'
  },
  signal100: {
    icon: 'Radio',
    activeLabel: 'СИГНАЛ 100 АКТИВЕН',
    inactiveLabel: 'СИГНАЛ 100',
    blockedLabel: 'СИГНАЛ 100 ЗАБЛОКИРОВАН',
    dialogTitle: 'Активация сигнала 100',
    dialogDescription: 'Это отправит звуковой сигнал 440 Гц всем активным экипажам и диспетчерам. Сигнал будет повторяться каждые 15 секунд.',
    actionLabel: 'Активировать сигнал',
    toastTitle: '🟡 СИГНАЛ 100 АКТИВИРОВАН',
    toastDescription: 'Звуковое оповещение отправлено всем экипажам и диспетчерам',
    activeColor: 'bg-yellow-600',
    hoverColor: 'hover:bg-yellow-600',
    dialogTitleColor: 'text-yellow-600',
    actionColor: 'bg-yellow-500',
    actionHoverColor: 'hover:bg-yellow-600',
    toastClassName: 'bg-yellow-500 text-white'
  }
};

interface EmergencyButtonProps {
  type: EmergencyType;
  crewId: number;
  userId: string;
  crewName: string;
  disabled?: boolean;
  activateFn: (crewId: number, userId: string) => void;
  isDisabledFn: () => boolean;
  syncEvents: Array<'crews_updated' | 'signal100_changed' | 'system_restrictions_changed'>;
  activeField: 'panicActive' | 'signal100Active';
  triggeredAtField: 'panicTriggeredAt' | 'signal100TriggeredAt';
}

const EmergencyButton = ({ 
  type, 
  crewId, 
  userId, 
  crewName, 
  disabled, 
  activateFn, 
  isDisabledFn,
  syncEvents,
  activeField,
  triggeredAtField
}: EmergencyButtonProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();
  const config = EMERGENCY_CONFIGS[type];

  const updateTimer = () => {
    const crew = getUserCrew(userId);
    if (crew?.[activeField] && crew[triggeredAtField]) {
      const triggeredTime = new Date(crew[triggeredAtField] as string).getTime();
      const now = Date.now();
      const elapsed = now - triggeredTime;
      const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
      setTimeRemaining(remaining);
      setIsActive(true);
    } else {
      setIsActive(false);
      setTimeRemaining(0);
    }
  };

  useSync(syncEvents, updateTimer, 5000);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  const handleActivate = () => {
    if (isDisabledFn()) {
      setConfirmOpen(false);
      toast({
        title: `${config.inactiveLabel} заблокирована`,
        description: `Менеджер заблокировал возможность активации ${config.inactiveLabel.toLowerCase()}`,
        variant: 'destructive'
      });
      return;
    }
    
    activateFn(crewId, userId);
    setConfirmOpen(false);
    
    const toastProps: any = {
      title: config.toastTitle,
      description: config.toastDescription,
    };
    
    if (type === 'panic') {
      toastProps.variant = 'destructive';
    }
    
    if (config.toastClassName) {
      toastProps.className = config.toastClassName;
    }
    
    toast(toastProps);
  };

  const isBlocked = isDisabledFn();
  const inactiveButtonClass = type === 'panic' 
    ? 'bg-green-600 hover:bg-green-700 text-white'
    : 'bg-yellow-500 hover:bg-yellow-600 text-white';

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || isBlocked}
        variant={disabled ? (type === 'panic' ? 'destructive' : 'secondary') : 'default'}
        size="sm"
        className={`w-full gap-2 font-bold ${
          disabled 
            ? `${config.activeColor} ${config.hoverColor} cursor-not-allowed` 
            : isBlocked
            ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white'
            : inactiveButtonClass
        }`}
      >
        <Icon name={config.icon} size={18} />
        {disabled ? (
          <span className="flex flex-col items-center leading-tight">
            <span className="text-xs">{config.activeLabel}</span>
            <span className="text-xs font-mono">
              ⏱️ {Math.floor(timeRemaining / 60000)}:{(Math.floor((timeRemaining % 60000) / 1000)).toString().padStart(2, '0')}
            </span>
          </span>
        ) : isBlocked ? (
          config.blockedLabel
        ) : (
          config.inactiveLabel
        )}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${config.dialogTitleColor}`}>
              <Icon name={config.icon} size={24} />
              {config.dialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите активировать {type === 'panic' ? 'кнопку паники' : 'сигнал 100'} для экипажа <strong>{crewName}</strong>?
              <br /><br />
              {config.dialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              className={`${config.actionColor} ${config.actionHoverColor}`}
            >
              {config.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmergencyButton;
