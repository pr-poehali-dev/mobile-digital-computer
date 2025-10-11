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
import { getAllUsers, deleteUser, updateUser, createUser } from '@/lib/store';
import { type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface AccountsTabProps {
  currentUser: User | null;
}

const AccountsTab = ({ currentUser }: AccountsTabProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: number | null }>({ open: false, userId: null });
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'dispatcher' as 'manager' | 'dispatcher'
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
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as 'manager' | 'dispatcher'
    });
    setEditDialog({ open: true, user });
  };

  const handleCreate = () => {
    setFormData({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'dispatcher'
    });
    setCreateDialog(true);
  };

  const handleSaveEdit = () => {
    if (editDialog.user) {
      updateUser(editDialog.user.id, formData);
      loadUsers();
      setEditDialog({ open: false, user: null });
      toast({
        title: 'Аккаунт обновлен',
        description: `Данные ${formData.fullName} успешно обновлены`,
      });
    }
  };

  const handleSaveCreate = () => {
    createUser(formData);
    loadUsers();
    setCreateDialog(false);
    toast({
      title: 'Аккаунт создан',
      description: `Пользователь ${formData.fullName} успешно добавлен`,
    });
  };

  const handleDelete = (userId: number) => {
    if (userId === currentUser?.id) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя удалить свой собственный аккаунт',
        variant: 'destructive'
      });
      return;
    }
    deleteUser(userId);
    loadUsers();
    setDeleteDialog({ open: false, userId: null });
    toast({
      title: 'Аккаунт удален',
      description: 'Пользователь удален из системы',
    });
  };

  const getRoleBadge = (role: string) => {
    return role === 'manager' 
      ? <Badge variant="default">Менеджер</Badge>
      : <Badge variant="secondary">Диспетчер</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление аккаунтами</CardTitle>
              <CardDescription>Добавляйте, редактируйте и удаляйте учетные записи пользователей</CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Icon name="UserPlus" size={16} className="mr-2" />
              Создать аккаунт
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Логин</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                          disabled={user.id === currentUser?.id}
                        >
                          <Icon name="Trash2" size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать аккаунт</DialogTitle>
            <DialogDescription>
              Измените данные пользователя {editDialog.user?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Логин</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullname">ФИО</Label>
              <Input
                id="edit-fullname"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
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
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Телефон</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Роль</Label>
              <Select value={formData.role} onValueChange={(value: 'manager' | 'dispatcher') => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispatcher">Диспетчер</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                </SelectContent>
              </Select>
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

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать аккаунт</DialogTitle>
            <DialogDescription>
              Добавьте нового пользователя в систему
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-username">Логин</Label>
              <Input
                id="create-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="dispatcher2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-fullname">ФИО</Label>
              <Input
                id="create-fullname"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Сидоров Сидор Сидорович"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@mdc.system"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Телефон</Label>
              <Input
                id="create-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 (999) 888-77-66"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Роль</Label>
              <Select value={formData.role} onValueChange={(value: 'manager' | 'dispatcher') => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispatcher">Диспетчер</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                </SelectContent>
              </Select>
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

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, userId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот аккаунт? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialog.userId && handleDelete(deleteDialog.userId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountsTab;
