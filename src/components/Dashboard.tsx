import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import CrewsTab from './tabs/CrewsTab';
import CallsTab from './tabs/CallsTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import LogTab from './tabs/LogTab';
import SettingsTab from './tabs/SettingsTab';
import AccountsTab from './tabs/AccountsTab';
import ProfileDialog from './ProfileDialog';
import DispatcherPanicAlert from './DispatcherPanicAlert';
import { type User } from '@/lib/auth';
import { canManageAccounts } from '@/lib/permissions';
import { startDispatcherShift, endDispatcherShift, isUserOnDuty, getActiveDispatcherShifts } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/use-sync';

interface DashboardProps {
  onLogout: () => void;
  currentUser: User | null;
}

const Dashboard = ({ onLogout, currentUser }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('crews');
  const [profileOpen, setProfileOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [activeDispatchers, setActiveDispatchers] = useState(0);
  const { toast } = useToast();

  const updateStatus = () => {
    if (currentUser) {
      setIsOnDuty(isUserOnDuty(currentUser.id));
      setActiveDispatchers(getActiveDispatcherShifts().length);
    }
  };

  useSync(['dispatcher_shift_changed'], updateStatus, 2000);

  const handleToggleDuty = () => {
    if (!currentUser) return;
    
    if (isOnDuty) {
      endDispatcherShift(currentUser.id);
      setIsOnDuty(false);
      const remaining = getActiveDispatcherShifts().length;
      setActiveDispatchers(remaining);
      toast({
        title: 'Дежурство завершено',
        description: remaining > 0 
          ? `Вы покинули дежурство. На дежурстве осталось диспетчеров: ${remaining}`
          : 'Вы покинули дежурство. Сотрудники могут управлять статусами самостоятельно.',
      });
    } else {
      startDispatcherShift(currentUser);
      setIsOnDuty(true);
      const total = getActiveDispatcherShifts().length;
      setActiveDispatchers(total);
      toast({
        title: 'Дежурство начато',
        description: total > 1 
          ? `Вы заступили на дежурство. Всего на дежурстве: ${total}`
          : 'Вы заступили на дежурство. Управление статусами через диспетчера.',
      });
    }
  };

  const handleLogout = () => {
    if (currentUser && isOnDuty) {
      endDispatcherShift(currentUser.id);
    }
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      <DispatcherPanicAlert currentUser={currentUser} />
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Radio" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MDC System</h1>
                <p className="text-xs text-muted-foreground">Диспетчерский контроль</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser?.role === 'dispatcher' && (
                <>
                  <Button
                    onClick={handleToggleDuty}
                    variant={isOnDuty ? 'destructive' : 'default'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon name={isOnDuty ? 'LogOut' : 'LogIn'} size={16} />
                    {isOnDuty ? 'Покинуть дежурство' : 'Заступить на дежурство'}
                  </Button>
                  {activeDispatchers > 0 && (
                    <Badge variant="secondary" className="gap-2">
                      <Icon name="Radio" size={14} />
                      На дежурстве: {activeDispatchers}
                    </Badge>
                  )}
                </>
              )}
              {currentUser && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium mb-1">{currentUser.fullName}</p>
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant="default" className="text-xs">
                      {currentUser.role === 'manager' && 'Менеджер'}
                      {currentUser.role === 'supervisor' && 'Руководитель'}
                      {currentUser.role === 'dispatcher' && 'Диспетчер'}
                      {currentUser.role === 'employee' && 'Сотрудник'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-mono">
                      #{currentUser.id}
                    </Badge>
                  </div>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                    <Icon name="User" size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {currentUser && (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{currentUser.fullName}</p>
                          <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <Icon name="User" size={16} className="mr-2" />
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                    <Icon name="Settings" size={16} className="mr-2" />
                    Настройки
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${canManageAccounts(currentUser) ? 'grid-cols-6' : 'grid-cols-5'} lg:w-auto lg:inline-grid`}>
            <TabsTrigger value="crews" className="space-x-2">
              <Icon name="Users" size={16} />
              <span className="hidden sm:inline">Экипажи</span>
            </TabsTrigger>
            <TabsTrigger value="calls" className="space-x-2">
              <Icon name="Phone" size={16} />
              <span className="hidden sm:inline">Вызовы</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="space-x-2">
              <Icon name="BarChart3" size={16} />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
            <TabsTrigger value="log" className="space-x-2">
              <Icon name="FileText" size={16} />
              <span className="hidden sm:inline">Журнал</span>
            </TabsTrigger>
            {canManageAccounts(currentUser) && (
              <TabsTrigger value="accounts" className="space-x-2">
                <Icon name="UserCog" size={16} />
                <span className="hidden sm:inline">Аккаунты</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="space-x-2">
              <Icon name="Settings" size={16} />
              <span className="hidden sm:inline">Настройки</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crews" className="space-y-4">
            {currentUser?.role === 'dispatcher' && !isOnDuty ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Icon name="Lock" size={64} className="text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-2xl font-semibold mb-2">Управление заблокировано</h3>
                <p className="text-muted-foreground mb-6">Заступите на дежурство для управления экипажами</p>
                <Button onClick={handleToggleDuty} size="lg">
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Заступить на дежурство
                </Button>
              </div>
            ) : (
              <CrewsTab currentUser={currentUser} />
            )}
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            {currentUser?.role === 'dispatcher' && !isOnDuty ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Icon name="Lock" size={64} className="text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-2xl font-semibold mb-2">Управление заблокировано</h3>
                <p className="text-muted-foreground mb-6">Заступите на дежурство для управления вызовами</p>
                <Button onClick={handleToggleDuty} size="lg">
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Заступить на дежурство
                </Button>
              </div>
            ) : (
              <CallsTab currentUser={currentUser} />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="log" className="space-y-4">
            <LogTab currentUser={currentUser} />
          </TabsContent>

          {canManageAccounts(currentUser) && (
            <TabsContent value="accounts" className="space-y-4">
              <AccountsTab currentUser={currentUser} />
            </TabsContent>
          )}

          <TabsContent value="settings" className="space-y-4">
            <SettingsTab currentUser={currentUser} />
          </TabsContent>
        </Tabs>
      </main>

      <ProfileDialog 
        open={profileOpen} 
        onOpenChange={setProfileOpen} 
        user={currentUser} 
      />
    </div>
  );
};

export default Dashboard;