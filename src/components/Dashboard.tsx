import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import CrewsTab from './tabs/CrewsTab';
import CallsTab from './tabs/CallsTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import LogTab from './tabs/LogTab';
import SettingsTab from './tabs/SettingsTab';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('crews');

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
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-sidebar-foreground">Диспетчер</p>
                <p className="text-xs text-sidebar-foreground/70">ID: 10245</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon name="User" size={20} className="text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="settings" className="space-x-2">
              <Icon name="Settings" size={16} />
              <span className="hidden sm:inline">Настройки</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crews" className="space-y-4">
            <CrewsTab />
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <CallsTab />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="log" className="space-y-4">
            <LogTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
