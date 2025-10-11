import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { getCrews, updateCrewStatus, createCrew, updateCrew, deleteCrew, getOnlineUsers, getAllUsers, type Crew } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

const getStatusConfig = (status: Crew['status']) => {
  switch (status) {
    case 'available':
      return { label: 'Доступен', variant: 'default' as const, bgColor: 'bg-success/10', textColor: 'text-success', icon: 'CheckCircle2' };
    case 'en-route':
      return { label: 'В пути', variant: 'default' as const, bgColor: 'bg-primary/10', textColor: 'text-primary', icon: 'Navigation' };
    case 'on-scene':
      return { label: 'На месте', variant: 'default' as const, bgColor: 'bg-warning/10', textColor: 'text-warning', icon: 'AlertCircle' };
    case 'unavailable':
      return { label: 'Недоступен', variant: 'secondary' as const, bgColor: 'bg-muted', textColor: 'text-muted-foreground', icon: 'XCircle' };
  }
};

const CrewsTab = () => {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [editDialog, setEditDialog] = useState<{ open: boolean; crew: Crew | null }>({ open: false, crew: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [manageDialog, setManageDialog] = useState<{ open: boolean; crew: Crew | null }>({ open: false, crew: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; crewId: number | null }>({ open: false, crewId: null });
  const [formData, setFormData] = useState({
    status: 'available' as Crew['status'],
    location: ''
  });
  const [crewFormData, setCrewFormData] = useState({
    unitName: '',
    members: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCrews();
  }, []);

  const loadCrews = () => {
    setCrews(getCrews());
  };

  const handleEdit = (crew: Crew) => {
    setFormData({
      status: crew.status,
      location: crew.location || ''
    });
    setEditDialog({ open: true, crew });
  };

  const handleManage = (crew: Crew) => {
    setCrewFormData({
      unitName: crew.unitName,
      members: crew.members || []
    });
    setManageDialog({ open: true, crew });
  };

  const handleCreate = () => {
    setCrewFormData({
      unitName: '',
      members: []
    });
    setCreateDialog(true);
  };

  const handleSaveStatus = () => {
    if (editDialog.crew) {
      updateCrewStatus(editDialog.crew.id, formData.status, formData.location);
      loadCrews();
      setEditDialog({ open: false, crew: null });
      toast({
        title: 'Статус обновлен',
        description: `Экипаж ${editDialog.crew.unitName} успешно обновлен`,
      });
    }
  };

  const handleSaveManage = () => {
    if (manageDialog.crew) {
      if (crewFormData.members.length === 0) {
        toast({
          title: 'Ошибка',
          description: 'Выберите хотя бы одного сотрудника',
          variant: 'destructive'
        });
        return;
      }
      updateCrew(manageDialog.crew.id, crewFormData.unitName, crewFormData.members);
      loadCrews();
      setManageDialog({ open: false, crew: null });
      toast({
        title: 'Экипаж обновлен',
        description: `Экипаж ${crewFormData.unitName} успешно обновлен`,
      });
    }
  };

  const handleCreateCrew = () => {
    if (!crewFormData.unitName) {
      toast({
        title: 'Ошибка',
        description: 'Введите название экипажа',
        variant: 'destructive'
      });
      return;
    }
    if (crewFormData.members.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы одного сотрудника',
        variant: 'destructive'
      });
      return;
    }
    createCrew(crewFormData.unitName, crewFormData.members);
    loadCrews();
    setCreateDialog(false);
    toast({
      title: 'Экипаж создан',
      description: `Экипаж ${crewFormData.unitName} успешно добавлен`,
    });
  };

  const handleDelete = (crewId: number) => {
    deleteCrew(crewId);
    loadCrews();
    setDeleteDialog({ open: false, crewId: null });
    toast({
      title: 'Экипаж удален',
      description: 'Экипаж удален из системы',
    });
  };

  const toggleMember = (userId: string) => {
    setCrewFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  const onlineUsers = getOnlineUsers();
  const allUsers = getAllUsers();
  const availableCount = crews.filter(c => c.status === 'available').length;
  const activeCount = crews.filter(c => c.status === 'en-route' || c.status === 'on-scene').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Экипажи</h2>
          <p className="text-sm text-muted-foreground">Онлайн сотрудников: {onlineUsers.length}</p>
        </div>
        <Button onClick={handleCreate}>
          <Icon name="Plus" size={18} className="mr-2" />
          Создать экипаж
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего экипажей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{crews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Доступно</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{availableCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">На заданиях</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crews.map((crew) => {
          const statusConfig = getStatusConfig(crew.status);
          const lastUpdate = new Date(crew.lastUpdate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const crewMembers = allUsers.filter(u => crew.members.includes(u.id));
          
          return (
            <Card key={crew.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{crew.unitName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Обновлено: {lastUpdate}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleManage(crew)}>
                      <Icon name="Edit" size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, crewId: crew.id })}>
                      <Icon name="Trash2" size={18} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${statusConfig.bgColor}`}>
                  <Icon name={statusConfig.icon} size={20} className={statusConfig.textColor} />
                  <span className={`font-medium ${statusConfig.textColor}`}>{statusConfig.label}</span>
                </div>
                
                {crew.location && (
                  <div className="flex items-start space-x-2 text-sm">
                    <Icon name="MapPin" size={16} className="text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{crew.location}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon name="Users" size={16} className="text-muted-foreground" />
                    <span>Состав ({crew.members.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {crewMembers.map(member => (
                      <Badge key={member.id} variant="outline" className="text-xs">
                        {member.fullName}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleEdit(crew)}
                  >
                    <Icon name="Settings" size={16} className="mr-1" />
                    Статус
                  </Button>
                  {crew.status === 'available' && (
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => handleEdit(crew)}
                    >
                      <Icon name="UserPlus" size={16} className="mr-1" />
                      Назначить
                    </Button>
                  )}
                  {crew.status === 'unavailable' && (
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        updateCrewStatus(crew.id, 'available');
                        loadCrews();
                        toast({ title: 'Экипаж активирован', description: `${crew.unitName} теперь доступен` });
                      }}
                    >
                      <Icon name="CheckCircle2" size={16} className="mr-1" />
                      Активировать
                    </Button>
                  )}
                  {(crew.status === 'en-route' || crew.status === 'on-scene') && (
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        updateCrewStatus(crew.id, 'available');
                        loadCrews();
                        toast({ title: 'Экипаж освобожден', description: `${crew.unitName} теперь доступен` });
                      }}
                    >
                      <Icon name="Home" size={16} className="mr-1" />
                      Освободить
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, crew: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Управление статусом {editDialog.crew?.unitName}</DialogTitle>
            <DialogDescription>
              Измените статус и местоположение экипажа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={formData.status} onValueChange={(value: Crew['status']) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="en-route">В пути</SelectItem>
                  <SelectItem value="on-scene">На месте</SelectItem>
                  <SelectItem value="unavailable">Недоступен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Местоположение</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Станция №1, ул. Ленина, 45..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, crew: null })}>
              Отмена
            </Button>
            <Button onClick={handleSaveStatus}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать экипаж</DialogTitle>
            <DialogDescription>
              Укажите название и выберите сотрудников
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitName">Название экипажа *</Label>
              <Input
                id="unitName"
                value={crewFormData.unitName}
                onChange={(e) => setCrewFormData({ ...crewFormData, unitName: e.target.value })}
                placeholder="Например: NU-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Сотрудники (онлайн: {onlineUsers.length}) *</Label>
              {onlineUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет онлайн сотрудников</p>
              ) : (
                <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {onlineUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-${user.id}`}
                        checked={crewFormData.members.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <label htmlFor={`create-${user.id}`} className="text-sm flex-1 cursor-pointer">
                        {user.fullName}
                        <Badge variant="secondary" className="ml-2 text-xs">#{user.id}</Badge>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateCrew}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageDialog.open} onOpenChange={(open) => setManageDialog({ open, crew: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать экипаж</DialogTitle>
            <DialogDescription>
              Измените название и состав экипажа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-unitName">Название экипажа *</Label>
              <Input
                id="edit-unitName"
                value={crewFormData.unitName}
                onChange={(e) => setCrewFormData({ ...crewFormData, unitName: e.target.value })}
                placeholder="Например: NU-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Сотрудники (онлайн: {onlineUsers.length}) *</Label>
              {onlineUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет онлайн сотрудников</p>
              ) : (
                <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {onlineUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${user.id}`}
                        checked={crewFormData.members.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <label htmlFor={`edit-${user.id}`} className="text-sm flex-1 cursor-pointer">
                        {user.fullName}
                        <Badge variant="secondary" className="ml-2 text-xs">#{user.id}</Badge>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageDialog({ open: false, crew: null })}>
              Отмена
            </Button>
            <Button onClick={handleSaveManage}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, crewId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить экипаж?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя будет отменить. Экипаж будет удален из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog.crewId && handleDelete(deleteDialog.crewId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CrewsTab;
