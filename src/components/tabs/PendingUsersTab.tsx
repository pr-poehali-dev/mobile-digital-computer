import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { getPendingUsers, activateUser, rejectRegistration, type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/use-sync';

const PendingUsersTab = () => {
  const [pendingUsers, setPendingUsers] = useState<Array<User & { id: string; registeredAt?: string }>>([]);
  const [activateDialog, setActivateDialog] = useState<{ 
    open: boolean; 
    user: (User & { id: string }) | null;
    selectedRole: User['role'];
  }>({ 
    open: false, 
    user: null,
    selectedRole: 'employee'
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; userId: string | null }>({ 
    open: false, 
    userId: null 
  });
  const { toast } = useToast();

  const loadPendingUsers = () => {
    setPendingUsers(getPendingUsers());
  };

  useSync(['users_updated'], loadPendingUsers, 5000);

  const handleActivate = (user: User & { id: string }) => {
    setActivateDialog({ 
      open: true, 
      user,
      selectedRole: 'employee'
    });
  };

  const handleConfirmActivate = () => {
    if (!activateDialog.user) return;

    const success = activateUser(activateDialog.user.id, activateDialog.selectedRole);
    
    if (success) {
      toast({
        title: 'Пользователь активирован',
        description: `${activateDialog.user.fullName} успешно активирован с ролью ${getRoleLabel(activateDialog.selectedRole)}`
      });
      loadPendingUsers();
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось активировать пользователя',
        variant: 'destructive'
      });
    }

    setActivateDialog({ open: false, user: null, selectedRole: 'employee' });
  };

  const handleReject = (userId: string) => {
    setRejectDialog({ open: true, userId });
  };

  const handleConfirmReject = () => {
    if (!rejectDialog.userId) return;

    const success = rejectRegistration(rejectDialog.userId);
    
    if (success) {
      toast({
        title: 'Заявка отклонена',
        description: 'Регистрация пользователя отклонена'
      });
      loadPendingUsers();
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отклонить заявку',
        variant: 'destructive'
      });
    }

    setRejectDialog({ open: false, userId: null });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'manager': return 'Менеджер';
      case 'dispatcher': return 'Диспетчер';
      case 'supervisor': return 'Руководитель';
      case 'employee': return 'Сотрудник';
      default: return role;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="UserPlus" size={20} />
              Заявки на регистрацию
            </CardTitle>
            <CardDescription>
              Активируйте новых пользователей и назначьте им роли
            </CardDescription>
          </div>
          {pendingUsers.length > 0 && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {pendingUsers.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="CheckCircle" size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Нет новых заявок</p>
            <p className="text-sm mt-2">Все заявки обработаны</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Имя и Фамилия</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.registeredAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleActivate(user)}
                          className="gap-1"
                        >
                          <Icon name="Check" size={14} />
                          Активировать
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(user.id)}
                          className="gap-1"
                        >
                          <Icon name="X" size={14} />
                          Отклонить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={activateDialog.open} onOpenChange={(open) => !open && setActivateDialog({ open: false, user: null, selectedRole: 'employee' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Активация пользователя</DialogTitle>
              <DialogDescription>
                Выберите роль для пользователя {activateDialog.user?.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Роль пользователя</label>
                <Select
                  value={activateDialog.selectedRole}
                  onValueChange={(value) => setActivateDialog(prev => ({ 
                    ...prev, 
                    selectedRole: value as User['role'] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Сотрудник</SelectItem>
                    <SelectItem value="dispatcher">Диспетчер</SelectItem>
                    <SelectItem value="supervisor">Руководитель</SelectItem>
                    <SelectItem value="manager">Менеджер</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                <Icon name="Info" size={14} className="inline mr-2" />
                После активации пользователь сможет войти в систему с выбранной ролью
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActivateDialog({ open: false, user: null, selectedRole: 'employee' })}>
                Отмена
              </Button>
              <Button onClick={handleConfirmActivate}>
                <Icon name="Check" size={16} className="mr-2" />
                Активировать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, userId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Отклонить заявку?</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите отклонить эту заявку на регистрацию? Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog({ open: false, userId: null })}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleConfirmReject}>
                <Icon name="X" size={16} className="mr-2" />
                Отклонить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PendingUsersTab;
