import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { getCalls, getCrews, getAllUsers, getDispatcherStats } from '@/lib/store';

const AnalyticsTab = () => {
  const [calls, setCalls] = useState<ReturnType<typeof getCalls>>([]);
  const [crews, setCrews] = useState<ReturnType<typeof getCrews>>([]);
  const [dispatchers, setDispatchers] = useState<ReturnType<typeof getAllUsers>>([]);

  useEffect(() => {
    setCalls(getCalls());
    setCrews(getCrews());
    setDispatchers(getAllUsers().filter(u => u.role === 'dispatcher'));
  }, []);

  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const activeCalls = calls.filter(c => c.status === 'dispatched').length;
  const activeCrews = crews.filter(c => c.status === 'en-route' || c.status === 'on-scene').length;

  const callTypes = calls.reduce((acc, call) => {
    acc[call.type] = (acc[call.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedTypes = Object.entries(callTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon name="Phone" size={16} className="mr-2" />
              Вызовов сегодня
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">Всего обработано</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon name="Clock" size={16} className="mr-2" />
              В работе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">Активных вызовов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon name="CheckCircle2" size={16} className="mr-2" />
              Завершено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{completedCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0}% успешно
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon name="Users" size={16} className="mr-2" />
              Активных экипажей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCrews}/{crews.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {crews.length > 0 ? ((activeCrews / crews.length) * 100).toFixed(1) : 0}% занятость
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Типы вызовов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            ) : (
              sortedTypes.map(([type, count]) => {
                const percentage = totalCalls > 0 ? (count / totalCalls) * 100 : 0;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{type}</span>
                      <span className="font-medium">{percentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика диспетчеров</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dispatchers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет диспетчеров</p>
            ) : (
              dispatchers.map((dispatcher) => {
                const stats = getDispatcherStats(dispatcher.id);
                const completionRate = stats.totalCalls > 0 
                  ? (stats.completedCalls / stats.totalCalls) * 100 
                  : 0;
                
                return (
                  <div key={dispatcher.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold">{dispatcher.fullName}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          ID: {dispatcher.id}
                        </Badge>
                      </div>
                      <span className="text-sm text-success font-medium">
                        {completionRate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={14} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Всего:</span>
                        <span className="font-medium">{stats.totalCalls}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="CheckCircle2" size={14} className="text-success" />
                        <span className="text-muted-foreground">Завершено:</span>
                        <span className="font-medium">{stats.completedCalls}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Activity" size={14} className="text-primary" />
                        <span className="text-muted-foreground">Активных:</span>
                        <span className="font-medium">{stats.activeCalls}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="AlertCircle" size={14} className="text-destructive" />
                        <span className="text-muted-foreground">Срочных:</span>
                        <span className="font-medium">{stats.urgentCalls}</span>
                      </div>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Эффективность экипажей</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {crews.map((crew) => {
            const crewCalls = calls.filter(c => c.assignedCrewId === crew.id);
            const completedCrewCalls = crewCalls.filter(c => c.status === 'completed').length;
            const efficiency = crewCalls.length > 0 
              ? (completedCrewCalls / crewCalls.length) * 100 
              : 0;
            
            const statusConfig = crew.status === 'available' 
              ? { color: 'text-success', icon: 'CheckCircle2' }
              : crew.status === 'en-route' 
              ? { color: 'text-primary', icon: 'Navigation' }
              : crew.status === 'on-scene'
              ? { color: 'text-warning', icon: 'AlertCircle' }
              : { color: 'text-muted-foreground', icon: 'XCircle' };

            return (
              <div key={crew.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{crew.unitName}</span>
                    <Icon name={statusConfig.icon} size={16} className={statusConfig.color} />
                  </div>
                  <span className="text-sm text-success font-medium">{efficiency.toFixed(0)}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                  <div>Вызовов: {crewCalls.length}</div>
                  <div>Завершено: {completedCrewCalls}</div>
                </div>
                <Progress value={efficiency} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Активность по часам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-48 gap-2">
            {[12, 8, 15, 22, 18, 25, 30, 28, 24, 20, 26, 22, 18, 15, 12, 10, 8, 12, 16, 20, 24, 26, 22, 18].map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 cursor-pointer"
                  style={{ height: `${(value / 30) * 100}%` }}
                  title={`${idx}:00 - ${value} вызовов`}
                />
                {idx % 4 === 0 && (
                  <span className="text-xs text-muted-foreground">{idx}:00</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
