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
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'role' | 'status'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'all' | 'frozen'>('all');
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

    if (user.frozen && user.frozenBySystem) {
      toast({
        title: 'Невозможно разморозить',
        description: 'Этот диспетчер заморожен системой из-за отключения диспетчерской системы. Сначала включите диспетчерскую систему.',
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

  const handleSort = (field: 'id' | 'name' | 'role' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortedAndFilteredUsers = () => {
    const filteredUsers = viewMode === 'frozen' 
      ? users.filter(u => u.frozen) 
      : users;

    const sorted = [...filteredUsers].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'name':
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'status':
          aValue = a.frozen ? 1 : 0;
          bValue = b.frozen ? 1 : 0;
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const sortedUsers = getSortedAndFilteredUsers();
  const frozenCount = users.filter(u => u.frozen).length;

  const activeCount = users.filter(u => !u.frozen).length;
  const managerCount = users.filter(u => u.role === 'manager').length;
  const supervisorCount = users.filter(u => u.role === 'supervisor').length;
  const dispatcherCount = users.filter(u => u.role === 'dispatcher').length;
  const employeeCount = users.filter(u => u.role === 'employee').length;

  return (
    <div className="space-y-6">
      {viewMode === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="Users" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Всего</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Icon name="CheckCircle" size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Активных</p>
                  <p className="text-2xl font-bold">{activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => frozenCount > 0 && setViewMode('frozen')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Icon name="Snowflake" size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Замороженных</p>
                  <p className="text-2xl font-bold">{frozenCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Icon name="Shield" size={20} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Управление</p>
                  <p className="text-2xl font-bold">{managerCount + supervisorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Icon name="UserCheck" size={20} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Персонал</p>
                  <p className="text-2xl font-bold">{dispatcherCount + employeeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {viewMode === 'frozen' && frozenCount > 0 && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Режим просмотра замороженных аккаунтов</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Отображаются только заблокированные аккаунты ({frozenCount} из {users.length}). Эти пользователи не могут войти в систему до разморозки.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                <Icon name="Users" size={16} className="mr-2" />
                Все аккаунты ({users.length})
              </Button>
              <Button
                variant={viewMode === 'frozen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('frozen')}
              >
                <Icon name="Snowflake" size={16} className="mr-2" />
                Замороженные ({frozenCount})
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Сортировка:</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">По ID</SelectItem>
                  <SelectItem value="name">По имени</SelectItem>
                  <SelectItem value="role">По роли</SelectItem>
                  <SelectItem value="status">По статусу</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <Icon name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={16} />
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Имя и фамилия</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Статус</TableHead>
                {viewMode === 'frozen' && <TableHead>Информация о заморозке</TableHead>}
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={viewMode === 'frozen' ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    {viewMode === 'frozen' ? 'Нет замороженных аккаунтов' : 'Нет пользователей'}
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => (
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
                  {viewMode === 'frozen' && (
                    <TableCell>
                      {user.frozen && user.frozenAt && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            {new Date(user.frozenAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {user.frozenBy && (
                            <p className="text-xs text-muted-foreground">
                              ID: {user.frozenBy}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
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
                ))
              )}
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