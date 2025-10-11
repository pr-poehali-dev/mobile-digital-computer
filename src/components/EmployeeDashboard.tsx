import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import ProfileDialog from './ProfileDialog';
import { type User } from '@/lib/auth';
import { getUserCrew, getCrewCalls, updateCrewStatus, isDispatcherOnDuty, getActiveDispatcherShifts, type Crew, type Call } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

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

const getPriorityConfig = (priority: Call['priority']) => {
  switch (priority) {
    case 'urgent':
      return { label: 'Критический', color: 'text-destructive', bgColor: 'bg-destructive/10' };
    case 'high':
      return { label: 'Высокий', color: 'text-orange-500', bgColor: 'bg-orange-500/10' };
    case 'medium':
      return { label: 'Средний', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
    case 'low':
      return { label: 'Низкий', color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
  }
};

const EmployeeDashboard = ({ onLogout, currentUser }: EmployeeDashboardProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [myCrew, setMyCrew] = useState<Crew | null>(null);
  const [myCalls, setMyCalls] = useState<Call[]>([]);
  const [dispatcherOnDuty, setDispatcherOnDuty] = useState(false);
  const [dispatcherShifts, setDispatcherShifts] = useState<ReturnType<typeof getActiveDispatcherShifts>>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadData = () => {
    if (!currentUser) return;
    
    const crew = getUserCrew(currentUser.id);
    setMyCrew(crew);
    
    if (crew) {
      const calls = getCrewCalls(crew.id);
      setMyCalls(calls);
    }
    
    setDispatcherOnDuty(isDispatcherOnDuty());
    setDispatcherShifts(getActiveDispatcherShifts());
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
    
    updateCrewStatus(myCrew.id, newStatus);
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
                    <p className="text-sm text-muted-foreground mt-1">Обратитесь к диспетчеру</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Phone" size={20} />
                    Мои вызовы
                  </CardTitle>
                  <Badge variant="secondary">{myCalls.length}</Badge>
                </div>
                <CardDescription>
                  Активные назначения для вашего экипажа
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myCalls.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="FileX" size={48} className="mx-auto mb-3 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">Нет активных вызовов</p>
                    <p className="text-sm text-muted-foreground mt-1">Ожидайте назначения от диспетчера</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myCalls.map((call) => {
                      const priorityConfig = getPriorityConfig(call.priority);
                      return (
                        <Card key={call.id} className="border-2">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {call.id}
                                </Badge>
                                <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color}`}>
                                  {priorityConfig.label}
                                </Badge>
                                <Badge variant={call.status === 'dispatched' ? 'default' : 'secondary'}>
                                  {call.status === 'dispatched' ? 'Назначен' : call.status === 'pending' ? 'Ожидает' : 'Завершен'}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{call.time}</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <p className="font-semibold text-lg">{call.type}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <Icon name="MapPin" size={16} className="text-muted-foreground mt-1" />
                                <div>
                                  <p className="font-medium">{call.address}</p>
                                  <Button variant="link" className="h-auto p-0 text-primary" asChild>
                                    <a href={`https://maps.google.com/?q=${encodeURIComponent(call.address)}`} target="_blank" rel="noopener noreferrer">
                                      Открыть на карте
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              {call.dispatcherName && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Icon name="User" size={14} />
                                  Диспетчер: {call.dispatcherName}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
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
    </div>
  );
};

export default EmployeeDashboard;