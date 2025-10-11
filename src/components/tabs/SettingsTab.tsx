import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { getUserSettings, updateUserSettings, getSystemLockdown, activateSystemLockdown, deactivateSystemLockdown, getSystemRestrictions, updateSystemRestrictions } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/use-sync';

interface SettingsTabProps {
  currentUser: User | null;
}

const SettingsTab = ({ currentUser }: SettingsTabProps) => {
  const { toast } = useToast();
  const [soundOnNewCall, setSoundOnNewCall] = useState(true);
  const [statusNotifications, setStatusNotifications] = useState(true);
  const [systemLocked, setSystemLocked] = useState(false);
  const [lockdownDialog, setLockdownDialog] = useState(false);
  const [dispatcherSystemDisabled, setDispatcherSystemDisabled] = useState(false);
  const [signal100Disabled, setSignal100Disabled] = useState(false);
  const [panicButtonDisabled, setPanicButtonDisabled] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const settings = getUserSettings(currentUser.id);
      setSoundOnNewCall(settings.soundOnNewCall);
      setStatusNotifications(settings.statusNotifications);
    }
    setSystemLocked(getSystemLockdown().active);
    
    const restrictions = getSystemRestrictions();
    setDispatcherSystemDisabled(restrictions.dispatcherSystemDisabled);
    setSignal100Disabled(restrictions.signal100Disabled);
    setPanicButtonDisabled(restrictions.panicButtonDisabled);
  }, [currentUser]);

  useSync(['system_lockdown_changed', 'user_settings_changed', 'system_restrictions_changed'], () => {
    if (currentUser) {
      const settings = getUserSettings(currentUser.id);
      setSoundOnNewCall(settings.soundOnNewCall);
      setStatusNotifications(settings.statusNotifications);
    }
    setSystemLocked(getSystemLockdown().active);
    
    const restrictions = getSystemRestrictions();
    setDispatcherSystemDisabled(restrictions.dispatcherSystemDisabled);
    setSignal100Disabled(restrictions.signal100Disabled);
    setPanicButtonDisabled(restrictions.panicButtonDisabled);
  }, 1000);

  const handleSoundToggle = (checked: boolean) => {
    setSoundOnNewCall(checked);
    if (currentUser) {
      updateUserSettings(currentUser.id, { soundOnNewCall: checked });
      toast({
        title: checked ? 'Звук включен' : 'Звук выключен',
        description: checked ? 'Звуковой сигнал будет воспроизводиться при новых вызовах' : 'Звуковой сигнал отключен'
      });
    }
  };

  const handleStatusNotificationsToggle = (checked: boolean) => {
    setStatusNotifications(checked);
    if (currentUser) {
      updateUserSettings(currentUser.id, { statusNotifications: checked });
      toast({
        title: checked ? 'Уведомления включены' : 'Уведомления выключены',
        description: checked ? 'Вы будете получать уведомления о статусах' : 'Уведомления о статусах отключены'
      });
    }
  };

  const handleLockdownToggle = () => {
    if (systemLocked) {
      deactivateSystemLockdown();
      toast({
        title: 'Блокировка снята',
        description: 'Все пользователи могут входить в систему',
        className: 'bg-success text-white'
      });
    } else {
      setLockdownDialog(true);
    }
  };

  const confirmLockdown = () => {
    if (currentUser) {
      activateSystemLockdown(currentUser.id);
      toast({
        title: 'Система заблокирована',
        description: 'Только менеджеры могут войти в систему. Все остальные пользователи вышли из системы.',
        variant: 'destructive'
      });
      setLockdownDialog(false);
    }
  };

  const handleDispatcherSystemToggle = (checked: boolean) => {
    updateSystemRestrictions({ dispatcherSystemDisabled: checked });
    toast({
      title: checked ? 'Система диспетчеров отключена' : 'Система диспетчеров включена',
      description: checked 
        ? 'Все диспетчеры сняты с дежурства. Заступить на дежурство невозможно.'
        : 'Диспетчеры могут заступать на дежурство',
      variant: checked ? 'destructive' : 'default'
    });
  };

  const handleSignal100Toggle = (checked: boolean) => {
    updateSystemRestrictions({ signal100Disabled: checked });
    toast({
      title: checked ? 'Сигнал 100 заблокирован' : 'Сигнал 100 разблокирован',
      description: checked 
        ? 'Никто не может активировать Сигнал 100'
        : 'Сигнал 100 доступен для активации',
      variant: checked ? 'destructive' : 'default'
    });
  };

  const handlePanicButtonToggle = (checked: boolean) => {
    updateSystemRestrictions({ panicButtonDisabled: checked });
    toast({
      title: checked ? 'Кнопка паники заблокирована' : 'Кнопка паники разблокирована',
      description: checked 
        ? 'Никто не может нажать кнопку паники'
        : 'Кнопка паники доступна для использования',
      variant: checked ? 'destructive' : 'default'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Профиль пользователя</CardTitle>
          <CardDescription>Управление учетной записью и персональными данными</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">ID</Label>
              <Input id="user-id" value={currentUser?.id || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-name">Имя и фамилия</Label>
              <Input id="user-name" value={currentUser?.fullName || ''} placeholder="Иван Иванов" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={currentUser?.email || ''} placeholder="user@example.com" />
            </div>
          </div>
          <Button>
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить изменения
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
          <CardDescription>Настройка оповещений и звуковых сигналов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Звук при новом вызове</Label>
              <p className="text-sm text-muted-foreground">Воспроизводить звуковой сигнал при назначении вызова</p>
            </div>
            <Switch checked={soundOnNewCall} onCheckedChange={handleSoundToggle} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Уведомления о статусах</Label>
              <p className="text-sm text-muted-foreground">Показывать изменения статусов экипажей</p>
            </div>
            <Switch checked={statusNotifications} onCheckedChange={handleStatusNotificationsToggle} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push-уведомления</Label>
              <p className="text-sm text-muted-foreground">Отправлять уведомления в браузер</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email-оповещения</Label>
              <p className="text-sm text-muted-foreground">Получать важные события на почту</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Интерфейс</CardTitle>
          <CardDescription>Настройка отображения и работы системы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refresh-rate">Частота обновления данных</Label>
            <Select defaultValue="5">
              <SelectTrigger id="refresh-rate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Каждые 5 секунд</SelectItem>
                <SelectItem value="10">Каждые 10 секунд</SelectItem>
                <SelectItem value="30">Каждые 30 секунд</SelectItem>
                <SelectItem value="60">Каждую минуту</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Темная тема</Label>
              <p className="text-sm text-muted-foreground">Использовать темное оформление</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Безопасность</CardTitle>
          <CardDescription>Управление безопасностью учетной записи</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Текущий пароль</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Новый пароль</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Подтвердите пароль</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>
            <Icon name="Lock" size={16} className="mr-2" />
            Изменить пароль
          </Button>
        </CardContent>
      </Card>

      {currentUser?.role === 'manager' && (
        <>
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Блокировка системы</CardTitle>
              <CardDescription>Экстренная блокировка доступа для всех пользователей кроме менеджеров</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">
                    {systemLocked ? '🔒 Система заблокирована' : '🔓 Система доступна'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {systemLocked 
                      ? 'Только менеджеры могут войти в систему'
                      : 'Все пользователи могут входить в систему'
                    }
                  </p>
                </div>
                <Switch 
                  checked={systemLocked} 
                  onCheckedChange={handleLockdownToggle}
                  className="data-[state=checked]:bg-destructive"
                />
              </div>
              {systemLocked && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <Icon name="AlertTriangle" size={20} className="text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">Система заблокирована</p>
                    <p className="text-muted-foreground">Все пользователи кроме менеджеров вышли из системы и не могут войти обратно до снятия блокировки.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="text-warning">Системные ограничения</CardTitle>
              <CardDescription>Блокировка отдельных функций системы для всех пользователей</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">
                    Система диспетчеров
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {dispatcherSystemDisabled 
                      ? 'Заступить на дежурство невозможно. Все диспетчеры сняты.'
                      : 'Диспетчеры могут заступать на дежурство'
                    }
                  </p>
                </div>
                <Switch 
                  checked={dispatcherSystemDisabled} 
                  onCheckedChange={handleDispatcherSystemToggle}
                  className="data-[state=checked]:bg-warning"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">
                    Сигнал 100
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {signal100Disabled 
                      ? 'Активация Сигнала 100 заблокирована'
                      : 'Сигнал 100 доступен для активации'
                    }
                  </p>
                </div>
                <Switch 
                  checked={signal100Disabled} 
                  onCheckedChange={handleSignal100Toggle}
                  className="data-[state=checked]:bg-warning"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">
                    Кнопка паники
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {panicButtonDisabled 
                      ? 'Нажатие кнопки паники заблокировано'
                      : 'Кнопка паники доступна для использования'
                    }
                  </p>
                </div>
                <Switch 
                  checked={panicButtonDisabled} 
                  onCheckedChange={handlePanicButtonToggle}
                  className="data-[state=checked]:bg-warning"
                />
              </div>

              {(dispatcherSystemDisabled || signal100Disabled || panicButtonDisabled) && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <Icon name="ShieldAlert" size={20} className="text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-warning">Активны системные ограничения</p>
                    <p className="text-muted-foreground">Некоторые функции системы заблокированы для всех пользователей.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={lockdownDialog} onOpenChange={setLockdownDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Заблокировать систему?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие немедленно выведет всех пользователей из системы (кроме менеджеров) и заблокирует их вход до снятия блокировки.
              <br /><br />
              <strong>Внимание:</strong> Используйте эту функцию только в экстренных случаях.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLockdown} className="bg-destructive hover:bg-destructive/90">
              Заблокировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsTab;