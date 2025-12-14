import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { getAllUsers, deleteUser, updateUser, createUser, changeUserId, freezeUser, unfreezeUser } from '@/lib/store';
import { type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import UsersTable from './accounts/UsersTable';
import UserFormDialog from './accounts/UserFormDialog';
import UserActionsDialogs from './accounts/UserActionsDialogs';

interface AccountsTabProps {
  currentUser: User | null;
}

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
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; user: User | null }>({ 
    open: false, 
    user: null 
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



  const handleSaveCreate = async () => {
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

    await createUser(formData.userId, formData.password, {
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
            У вас недостаточно прав для управления аккаунтами
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filteredUsers = users
    .filter(user => {
      if (viewMode === 'frozen') return user.frozen;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'status':
          comparison = (a.frozen ? 1 : 0) - (b.frozen ? 1 : 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление аккаунтами</CardTitle>
              <CardDescription>
                Создание, редактирование и удаление пользователей системы
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Icon name="UserPlus" size={16} className="mr-2" />
              Создать аккаунт
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Сортировка</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">По ID</SelectItem>
                  <SelectItem value="name">По имени</SelectItem>
                  <SelectItem value="role">По роли</SelectItem>
                  <SelectItem value="status">По статусу</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Порядок</label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">По возрастанию</SelectItem>
                  <SelectItem value="desc">По убыванию</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Фильтр</label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  <SelectItem value="frozen">Замороженные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <UsersTable
            users={filteredUsers}
            currentUser={currentUser}
            onEdit={handleEdit}
            onDelete={(userId) => setDeleteDialog({ open: true, userId })}
            onFreezeToggle={handleFreezeToggle}
            onChangePassword={(user) => setPasswordDialog({ open: true, user })}
          />
        </CardContent>
      </Card>

      <UserFormDialog
        open={editDialog.open}
        mode="edit"
        user={editDialog.user}
        formData={formData}
        onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
        onSave={handleSaveEdit}
        onCancel={() => setEditDialog({ open: false, user: null })}
      />

      <UserFormDialog
        open={createDialog}
        mode="create"
        user={null}
        formData={formData}
        onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
        onSave={handleSaveCreate}
        onCancel={() => setCreateDialog(false)}
      />

      <UserActionsDialogs
        deleteDialog={deleteDialog}
        freezeDialog={freezeDialog}
        passwordDialog={passwordDialog}
        onDeleteConfirm={() => deleteDialog.userId && handleDelete(deleteDialog.userId)}
        onDeleteCancel={() => setDeleteDialog({ open: false, userId: null })}
        onFreezeConfirm={handleConfirmFreeze}
        onFreezeCancel={() => setFreezeDialog({ open: false, user: null, action: 'freeze' })}
        onPasswordClose={() => setPasswordDialog({ open: false, user: null })}
      />
    </div>
  );
};

export default AccountsTab;
