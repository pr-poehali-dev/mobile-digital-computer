import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import ProfileDialog from './ProfileDialog';
import { type User } from '@/lib/auth';
import { getUserCrew, getCrewCalls, updateCrewStatus, isDispatcherOnDuty, getActiveDispatcherShifts, getAvailableCrewMembers, createCrew, deleteCrew, type Crew, type Call } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeTabsContent from './EmployeeTabsContent';

interface EmployeeDashboardProps {
  onLogout: () => void;
  currentUser: User | null;
}

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

const EmployeeDashboard = ({ onLogout, currentUser }: EmployeeDashboardProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calls' | 'analytics' | 'logs'>('calls');
  const [myCrew, setMyCrew] = useState<Crew | null>(null);
  const [myCalls, setMyCalls] = useState<Call[]>([]);
  const [dispatcherOnDuty, setDispatcherOnDuty] = useState(false);
  const [dispatcherShifts, setDispatcherShifts] = useState<ReturnType<typeof getActiveDispatcherShifts>>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ReturnType<typeof getAvailableCrewMembers>>([]);
  const [crewFormData, setCrewFormData] = useState({ unitName: '', members: [] as string[] });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mdc_dispatcher_shifts') {
        loadData();
      }
    };
    
    const handleShiftChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dispatcher_shift_changed', handleShiftChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dispatcher_shift_changed', handleShiftChange);
    };
  }, [currentUser]);

  useEffect(() => {
    loadAvailableUsers();
    const interval = setInterval(loadAvailableUsers, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    if (!currentUser) return;
    
    const crew = getUserCrew(currentUser.id);
    setMyCrew(crew);
    
    if (crew) {
      const calls = getCrewCalls(crew.id);
      setMyCalls(calls);
    }
    
    const dispatcherStatus = isDispatcherOnDuty();
    setDispatcherOnDuty(dispatcherStatus);
    setDispatcherShifts(getActiveDispatcherShifts());
    
    if (dispatcherStatus && (createDialog || deleteDialog)) {
      setCreateDialog(false);
      setDeleteDialog(false);
    }
  };

  const loadAvailableUsers = () => {
    setAvailableUsers(getAvailableCrewMembers());
  };

  const handleCreateCrew = () => {
    if (dispatcherOnDuty) {
      toast({ title: 'Недоступно', description: 'Диспетчер на дежурстве. Обратитесь к диспетчеру.', variant: 'destructive' });
      setCreateDialog(false);
      return;
    }
    if (!crewFormData.unitName.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название экипажа', variant: 'destructive' });
      return;
    }
    if (!crewFormData.members.includes(currentUser!.id)) {
      crewFormData.members.push(currentUser!.id);
    }
    createCrew(crewFormData.unitName, crewFormData.members, currentUser!.id);
    loadData();
    setCreateDialog(false);
    setCrewFormData({ unitName: '', members: [] });
    toast({ title: 'Экипаж создан', description: `Экипаж ${crewFormData.unitName} успешно создан` });
  };

  const handleOpenCreateDialog = () => {
    if (dispatcherOnDuty) {
      toast({ title: 'Недоступно', description: 'Диспетчер на дежурстве. Обратитесь к диспетчеру.', variant: 'destructive' });
      return;
    }
    setCreateDialog(true);
  };

  const handleDeleteCrew = () => {
    if (!myCrew) return;
    if (dispatcherOnDuty) {
      toast({ title: 'Недоступно', description: 'Диспетчер на дежурстве. Обратитесь к диспетчеру.', variant: 'destructive' });
      setDeleteDialog(false);
      return;
    }
    deleteCrew(myCrew.id, currentUser!.id);
    loadData();
    setDeleteDialog(false);
    toast({ title: 'Экипаж удален', description: 'Ваш экипаж удален из системы' });
  };

  const toggleMember = (userId: string) => {
    setCrewFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId) ? prev.members.filter(id => id !== userId) : [...prev.members, userId]
    }));
  };

  const handleStatusChange = (newStatus: Crew['status']) => {
    if (!myCrew) return;
    
    if (dispatcherOnDuty) {
      toast({
        title: 'Управление недоступно',
        description: 'Диспетчер на дежурстве управляет статусами',
        variant: 'destructive'
      });
      return;
    }
    
    updateCrewStatus(myCrew.id, newStatus, undefined, currentUser!.id);
    loadData();
    toast({
      title: 'Статус обновлен',
      description: `Ваш экипаж теперь: ${getStatusConfig(newStatus).label}`,
    });
  };

  if (!currentUser) return null;

  const statusConfig = myCrew ? getStatusConfig(myCrew.status) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar border-b border-sidebar-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Icon name="Radio" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">MDC System</h1>
                <p className="text-xs text-sidebar-foreground/70">Панель сотрудника</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {dispatcherOnDuty && dispatcherShifts.length > 0 && (
                <Badge variant="outline" className="gap-2">
                  <Icon name="Radio" size={14} />
                  {dispatcherShifts.length === 1 
                    ? `На связи: ${dispatcherShifts[0].dispatcherName}`
                    : `На дежурстве: ${dispatcherShifts.length} диспетчера`
                  }
                </Badge>
              )}
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    Сотрудник
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-mono">
                    #{currentUser.id}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-sidebar-foreground">{currentUser.fullName}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-primary/20">
                    <Icon name="User" size={20} className="text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{currentUser.fullName}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <Icon name="User" size={16} className="mr-2" />
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive">
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Users" size={20} />
                  Мой экипаж
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myCrew ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold">{myCrew.unitName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Обновлено: {new Date(myCrew.lastUpdate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {statusConfig && (
                      <div className={`flex items-center space-x-2 p-3 rounded-lg ${statusConfig.bgColor}`}>
                        <Icon name={statusConfig.icon} size={20} className={statusConfig.textColor} />
                        <span className={`font-medium ${statusConfig.textColor}`}>{statusConfig.label}</span>
                      </div>
                    )}

                    {myCrew.location && (
                      <div className="flex items-start space-x-2 text-sm">
                        <Icon name="MapPin" size={16} className="text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{myCrew.location}</span>
                      </div>
                    )}

                    {!dispatcherOnDuty && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Изменить статус:</p>
                        <Select value={myCrew.status} onValueChange={(value: Crew['status']) => handleStatusChange(value)}>
                          <SelectTrigger>
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
                    )}

                    {dispatcherOnDuty && (
                      <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                        <Icon name="Lock" size={16} className="inline mr-2" />
                        Управление статусом через диспетчера
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="UserX" size={48} className="mx-auto mb-3 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">Вы не прикреплены к экипажу</p>
                    {!dispatcherOnDuty ? (
                      <>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">Создайте экипаж самостоятельно</p>
                        <Button onClick={handleOpenCreateDialog} variant="default">
                          <Icon name="Plus" size={16} className="mr-2" />
                          Создать экипаж
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">Обратитесь к диспетчеру</p>
                    )}
                  </div>
                )}
              </CardContent>
              {myCrew && !dispatcherOnDuty && (
                <div className="px-6 pb-4">
                  <Button onClick={() => setDeleteDialog(true)} variant="destructive" className="w-full">
                    <Icon name="Trash2" size={16} className="mr-2" />
                    Удалить экипаж
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'calls' | 'analytics' | 'logs')} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="calls" className="gap-2">
                      <Icon name="Phone" size={16} />
                      Вызовы
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                      <Icon name="BarChart3" size={16} />
                      Аналитика
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                      <Icon name="FileText" size={16} />
                      Журнал
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <EmployeeTabsContent activeTab={activeTab} myCalls={myCalls} userId={currentUser.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={currentUser}
      />

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать экипаж</DialogTitle>
            <DialogDescription>
              Укажите название и добавьте онлайн сотрудников в экипаж
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitName">Название экипажа</Label>
              <Input
                id="unitName"
                placeholder="Например: NU-01"
                value={crewFormData.unitName}
                onChange={(e) => setCrewFormData({ ...crewFormData, unitName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Состав экипажа (онлайн сотрудники)</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                <div className="flex items-center space-x-2 p-2 bg-primary/5 rounded">
                  <Checkbox checked disabled />
                  <Label className="flex-1 cursor-default">
                    <div className="font-medium">{currentUser?.fullName}</div>
                    <div className="text-xs text-muted-foreground">Вы (командир)</div>
                  </Label>
                </div>
                {availableUsers.filter(u => u.id !== currentUser?.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет других онлайн сотрудников
                  </p>
                ) : (
                  availableUsers
                    .filter(u => u.id !== currentUser?.id)
                    .map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={crewFormData.members.includes(user.id)}
                          onCheckedChange={() => toggleMember(user.id)}
                          id={`user-${user.id}`}
                        />
                        <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                        </Label>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateCrew}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить экипаж?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить экипаж {myCrew?.unitName}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCrew} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeDashboard;