import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getUserActivityLogs, getEmployeeStats, type Call, type ActivityLog } from '@/lib/store';

interface EmployeeTabsContentProps {
  activeTab: 'calls' | 'analytics' | 'logs';
  myCalls: Call[];
  userId: string;
}

const getPriorityConfig = (priority: Call['priority']) => {
  switch (priority) {
    case 'code99':
      return { label: 'Код 99', color: 'text-white', bgColor: 'bg-red-500' };
    case 'code3':
      return { label: 'Код 3', color: 'text-white', bgColor: 'bg-yellow-500' };
    case 'code2':
      return { label: 'Код 2', color: 'text-white', bgColor: 'bg-green-500' };
    default:
      return { label: 'Код 2', color: 'text-white', bgColor: 'bg-green-500' };
  }
};

const getLogIcon = (type: ActivityLog['type']) => {
  switch (type) {
    case 'crew_created': return 'UserPlus';
    case 'crew_deleted': return 'UserMinus';
    case 'crew_status': return 'RefreshCw';
    case 'call_assigned': return 'Bell';
    case 'call_completed': return 'CheckCircle2';
    case 'panic_activated': return 'AlertTriangle';
    case 'panic_reset': return 'XCircle';
    case 'signal100_activated': return 'Radio';
    case 'signal100_reset': return 'RadioOff';
    default: return 'Info';
  }
};

const EmployeeTabsContent = ({ activeTab, myCalls, userId }: EmployeeTabsContentProps) => {
  const stats = getEmployeeStats(userId);
  const logs = getUserActivityLogs(userId);

  if (activeTab === 'calls') {
    return (
      <div className="space-y-4">
        {myCalls.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="FileX" size={48} className="mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Нет активных вызовов</p>
            <p className="text-sm text-muted-foreground mt-1">Ожидайте назначения от диспетчера</p>
          </div>
        ) : (
          myCalls.map((call) => {
            const priorityConfig = getPriorityConfig(call.priority);
            return (
              <Card key={call.id} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
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
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(call.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
          })
        )}
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Всего вызовов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon name="Phone" size={20} className="text-primary" />
                <p className="text-3xl font-bold">{stats.totalCalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Завершено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" size={20} className="text-success" />
                <p className="text-3xl font-bold">{stats.completedCalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Активных</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon name="Navigation" size={20} className="text-primary" />
                <p className="text-3xl font-bold">{stats.activeCalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Код 99</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon name="AlertCircle" size={20} className="text-red-500" />
                <p className="text-3xl font-bold">{stats.urgentCalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Код 3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon name="TrendingUp" size={20} className="text-yellow-500" />
                <p className="text-3xl font-bold">{stats.highPriority}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Аналитика за 24 часа</CardTitle>
            <CardDescription>Статистика по вашим экипажам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Завершено: {stats.completedCalls} из {stats.totalCalls} вызовов</p>
              <p>
                • Эффективность:{' '}
                {stats.totalCalls > 0 ? Math.round((stats.completedCalls / stats.totalCalls) * 100) : 0}%
              </p>
              <p>• Код 99 вызовов обработано: {stats.urgentCalls}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'logs') {
    return (
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Нет записей в журнале</p>
            <p className="text-sm text-muted-foreground mt-1">История за последние 24 часа пуста</p>
          </div>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Icon name={getLogIcon(log.type)} size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{log.description}</p>
                    {log.details && <p className="text-sm text-muted-foreground">{log.details}</p>}
                    {log.crewName && (
                      <Badge variant="outline" className="text-xs">
                        {log.crewName}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  return null;
};

export default EmployeeTabsContent;