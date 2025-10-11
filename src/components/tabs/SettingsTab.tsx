import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';

interface SettingsTabProps {
  currentUser: User | null;
}

const SettingsTab = ({ currentUser }: SettingsTabProps) => {
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
              <p className="text-sm text-muted-foreground">Воспроизводить звуковой сигнал</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Уведомления о статусах</Label>
              <p className="text-sm text-muted-foreground">Показывать изменения статусов экипажей</p>
            </div>
            <Switch defaultChecked />
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
    </div>
  );
};

export default SettingsTab;