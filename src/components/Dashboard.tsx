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
import { type User } from '@/lib/auth';
import { canManageAccounts } from '@/lib/permissions';
import { startDispatcherShift, endDispatcherShift, getActiveDispatcherShift } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  onLogout: () => void;
  currentUser: User | null;
}

const Dashboard = ({ onLogout, currentUser }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('crews');
  const [profileOpen, setProfileOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const shift = getActiveDispatcherShift();
    if (shift && currentUser && shift.dispatcherId === currentUser.id) {
      setIsOnDuty(true);
    }
  }, [currentUser]);

  const handleToggleDuty = () => {
    if (!currentUser) return;
    
    if (isOnDuty) {
      endDispatcherShift();
      setIsOnDuty(false);
      toast({
        title: 'Дежурство завершено',
        description: 'Вы покинули дежурство. Сотрудники могут управлять статусами самостоятельно.',
      });
    } else {
      startDispatcherShift(currentUser);
      setIsOnDuty(true);
      toast({
        title: 'Дежурство начато',
        description: 'Вы заступили на дежурство. Управление статусами через диспетчера.',
      });
    }
  };

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
                <p className="text-xs text-sidebar-foreground/70">Диспетчерский контроль</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser?.role === 'dispatcher' && (
                <Button
                  onClick={handleToggleDuty}
                  variant={isOnDuty ? 'destructive' : 'default'}
                  size="sm"
                  className="gap-2"
                >
                  <Icon name={isOnDuty ? 'LogOut' : 'LogIn'} size={16} />
                  {isOnDuty ? 'Покинуть дежурство' : 'Заступить на дежурство'}
                </Button>
              )}
              {currentUser && (
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {currentUser.role === 'manager' && 'Менеджер'}
                      {currentUser.role === 'supervisor' && 'Руководитель'}
                      {currentUser.role === 'dispatcher' && 'Диспетчер'}
                      {currentUser.role === 'employee' && 'Сотрудник'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-mono">
                      #{currentUser.id}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-sidebar-foreground">{currentUser.fullName}</p>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-primary/20">
                    <Icon name="User" size={20} className="text-primary" />
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
            <CrewsTab />
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <CallsTab currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="log" className="space-y-4">
            <LogTab />
          </TabsContent>

          {canManageAccounts(currentUser) && (
            <TabsContent value="accounts" className="space-y-4">
              <AccountsTab currentUser={currentUser} />
            </TabsContent>
          )}

          <TabsContent value="settings" className="space-y-4">
            <SettingsTab />
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