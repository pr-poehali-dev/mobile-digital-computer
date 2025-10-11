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
import { getAllUsers, deleteUser, updateUser, createUser, changeUserId } from '@/lib/store';
import { type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

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

    const usersData = localStorage.getItem('mdc_users');
    const users = usersData ? JSON.parse(usersData) : [];
    users.push({
      id: formData.userId,
      password: formData.password,
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role
    });
    localStorage.setItem('mdc_users', JSON.stringify(users));

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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Например: 10005"
                maxLength={5}
                pattern="[0-9]{5}"
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
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Иван Иванов"
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
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
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Например: 10005"
                maxLength={5}
                pattern="[0-9]{5}"
                disabled={editDialog.user?.id === currentUser?.id}
              />
              <p className="text-xs text-muted-foreground">Ровно 5 цифр. {editDialog.user?.id === currentUser?.id ? 'Нельзя изменить свой ID' : 'Используется для входа в систему'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Имя и фамилия</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Иван Иванов"
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
    </div>
  );
};

export default AccountsTab;