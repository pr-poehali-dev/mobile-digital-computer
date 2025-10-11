import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { getAllUsers, deleteUser, updateUser, createUser, changeUserId, freezeUser, unfreezeUser } from '@/lib/store';
import { type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { sanitizeName, sanitizeEmail, sanitizeId } from '@/lib/sanitize';
import { canFreezeUser } from '@/lib/permissions';

interface AccountsTabProps {
  currentUser: User | null;
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'manager': return 'Менеджер';
    case 'dispatcher': return 'Диспетчер';
    case 'supervisor': return 'Руководитель';
    case 'employee': return 'Сотрудник';
    default: return role;
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'manager': return 'default';
    case 'supervisor': return 'default';
    case 'dispatcher': return 'secondary';
    case 'employee': return 'outline';
    default: return 'outline';
  }
};

const AccountsTab = ({ currentUser }: AccountsTabProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [freezeDialog, setFreezeDialog] = useState<{ open: boolean; user: User | null; action: 'freeze' | 'unfreeze' }>({ 
    open: false, 
    user: null, 
    action: 'freeze' 
  });
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    fullName: '',
    email: '',
    role: 'employee' as User['role']
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getAllUsers());
  };

  const handleEdit = (user: User) => {
    setFormData({
      userId: user.id,
      password: '',
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
    setEditDialog({ open: true, user });
  };

  const handleCreate = () => {
    setFormData({
      userId: '',
      password: '',
      fullName: '',
      email: '',
      role: 'employee'
    });
    setCreateDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editDialog.user) return;

    if (!formData.userId || formData.userId.length !== 5 || !/^\d{5}$/.test(formData.userId)) {
      toast({
        title: 'Ошибка',
        description: 'ID должен содержать ровно 5 цифр',
        variant: 'destructive'
      });
      return;
    }

    const oldId = editDialog.user.id;
    const newId = formData.userId;

    if (oldId !== newId) {
      const success = changeUserId(oldId, newId);
      
      if (!success) {
        toast({
          title: 'Ошибка',
          description: 'ID уже занят другим пользователем',
          variant: 'destructive'
        });
        return;
      }

      const usersData = localStorage.getItem('mdc_users');
      if (usersData) {
        const users = JSON.parse(usersData);
        const updated = users.map((u: any) => 
          u.id === oldId ? { ...u, id: newId } : u
        );
        localStorage.setItem('mdc_users', JSON.stringify(updated));
      }
    }

    updateUser(newId, {
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role
    });

    loadUsers();
    setEditDialog({ open: false, user: null });
    toast({
      title: 'Аккаунт обновлен',
      description: `Данные ${formData.fullName} успешно обновлены${oldId !== newId ? ` (ID изменен на #${newId})` : ''}`,
    });
  };



  const handleSaveCreate = () => {
    if (!formData.userId || formData.userId.length !== 5) {
      toast({
        title: 'Ошибка',
        description: 'ID должен содержать ровно 5 цифр',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен быть не менее 6 символов',
        variant: 'destructive'
      });
      return;
    }

    const existingUser = users.find(u => u.id === formData.userId);
    if (existingUser) {
      toast({
        title: 'Ошибка',
        description: 'Пользователь с таким ID уже существует',
        variant: 'destructive'
      });
      return;
    }

    createUser(formData.userId, formData.password, {
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role
    });

    loadUsers();
    setCreateDialog(false);
    toast({
      title: 'Аккаунт создан',
      description: `Пользователь ${formData.fullName} с ID ${formData.userId} успешно добавлен`,
    });
  };

  const handleDelete = (userId: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя удалить свой собственный аккаунт',
        variant: 'destructive'
      });
      return;
    }

    deleteUser(userId);

    const usersData = localStorage.getItem('mdc_users');
    if (usersData) {
      const users = JSON.parse(usersData);
      const filtered = users.filter((u: any) => u.id !== userId);
      localStorage.setItem('mdc_users', JSON.stringify(filtered));
    }

    loadUsers();
    setDeleteDialog({ open: false, userId: null });
    toast({
      title: 'Аккаунт удален',
      description: 'Пользователь удален из системы',
    });
  };

  const handleFreezeToggle = (user: User) => {
    if (!currentUser) return;
    
    if (!canFreezeUser(currentUser, user)) {
      toast({
        title: 'Недостаточно прав',
        description: 'Вы можете замораживать только нижестоящих пользователей',
        variant: 'destructive'
      });
      return;
    }

    setFreezeDialog({ 
      open: true, 
      user, 
      action: user.frozen ? 'unfreeze' : 'freeze' 
    });
  };

  const handleConfirmFreeze = () => {
    if (!freezeDialog.user || !currentUser) return;

    if (freezeDialog.action === 'freeze') {
      freezeUser(freezeDialog.user.id, currentUser.id);
      toast({
        title: 'Аккаунт заморожен',
        description: `${freezeDialog.user.fullName} больше не может войти в систему`,
        variant: 'destructive'
      });
    } else {
      unfreezeUser(freezeDialog.user.id);
      toast({
        title: 'Аккаунт разморожен',
        description: `${freezeDialog.user.fullName} может снова войти в систему`,
        className: 'bg-success text-white'
      });
    }

    loadUsers();
    setFreezeDialog({ open: false, user: null, action: 'freeze' });
  };

  const canManageUsers = currentUser?.role === 'manager' || currentUser?.role === 'supervisor';

  if (!canManageUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Доступ ограничен</CardTitle>
          <CardDescription>
            У вас нет прав для просмотра этого раздела
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const canEditUser = (user: User) => {
    if (currentUser?.role === 'manager') return true;
    if (currentUser?.role === 'supervisor' && user.role !== 'manager') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление аккаунтами</CardTitle>
              <CardDescription>Создание и редактирование пользователей системы</CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Icon name="UserPlus" size={18} className="mr-2" />
              Создать аккаунт
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Имя и фамилия</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">#{user.id}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role) as any}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {user.frozen ? (
                      <Badge variant="destructive" className="gap-1">
                        <Icon name="Snowflake" size={12} />
                        Заморожен
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-success border-success">
                        <Icon name="CheckCircle" size={12} />
                        Активен
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {currentUser && canFreezeUser(currentUser, user) && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleFreezeToggle(user)}
                          disabled={user.id === currentUser?.id}
                          title={user.frozen ? 'Разморозить аккаунт' : 'Заморозить аккаунт'}
                        >
                          <Icon name={user.frozen ? "Flame" : "Snowflake"} size={16} className={user.frozen ? "text-orange-500" : "text-blue-500"} />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(user)}
                        disabled={!canEditUser(user)}
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                        disabled={user.id === currentUser?.id || !canEditUser(user)}
                      >
                        <Icon name="Trash2" size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый аккаунт</DialogTitle>
            <DialogDescription>
              Укажите ID, пароль и данные нового пользователя
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">ID *</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: sanitizeId(e.target.value) })}
                placeholder="Например: 10005"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">Ровно 5 цифр. Используется для входа в систему</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Минимум 6 символов"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Имя и фамилия *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: sanitizeName(e.target.value) })}
                placeholder="Иван Иванов"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentUser?.role === 'manager' && (
                    <>
                      <SelectItem value="manager">Менеджер</SelectItem>
                      <SelectItem value="supervisor">Руководитель</SelectItem>
                    </>
                  )}
                  <SelectItem value="dispatcher">Диспетчер</SelectItem>
                  <SelectItem value="employee">Сотрудник</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.trim().toLowerCase() })}
                placeholder="user@example.com"
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveCreate}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать аккаунт</DialogTitle>
            <DialogDescription>
              Изменение данных пользователя
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-userId">ID *</Label>
              <Input
                id="edit-userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: sanitizeId(e.target.value) })}
                placeholder="Например: 10005"
                maxLength={10}
                disabled={editDialog.user?.id === currentUser?.id}
              />
              <p className="text-xs text-muted-foreground">Ровно 5 цифр. {editDialog.user?.id === currentUser?.id ? 'Нельзя изменить свой ID' : 'Используется для входа в систему'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Имя и фамилия</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: sanitizeName(e.target.value) })}
                placeholder="Иван Иванов"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Роль</Label>
              <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentUser?.role === 'manager' && (
                    <>
                      <SelectItem value="manager">Менеджер</SelectItem>
                      <SelectItem value="supervisor">Руководитель</SelectItem>
                    </>
                  )}
                  <SelectItem value="dispatcher">Диспетчер</SelectItem>
                  <SelectItem value="employee">Сотрудник</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.trim().toLowerCase() })}
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, userId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя будет отменить. Пользователь будет удален из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog.userId && handleDelete(deleteDialog.userId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={freezeDialog.open} onOpenChange={(open) => setFreezeDialog({ open, user: null, action: 'freeze' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name={freezeDialog.action === 'freeze' ? 'Snowflake' : 'Flame'} size={24} className={freezeDialog.action === 'freeze' ? 'text-blue-500' : 'text-orange-500'} />
              {freezeDialog.action === 'freeze' ? 'Заморозить аккаунт?' : 'Разморозить аккаунт?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {freezeDialog.action === 'freeze' ? (
                <>
                  Пользователь <strong>{freezeDialog.user?.fullName}</strong> будет немедленно выведен из системы и не сможет войти обратно до разморозки аккаунта.
                  <br /><br />
                  <strong>Внимание:</strong> Используйте эту функцию для временной блокировки доступа пользователя.
                </>
              ) : (
                <>
                  Пользователь <strong>{freezeDialog.user?.fullName}</strong> снова сможет войти в систему.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmFreeze}
              className={freezeDialog.action === 'freeze' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {freezeDialog.action === 'freeze' ? 'Заморозить' : 'Разморозить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountsTab;