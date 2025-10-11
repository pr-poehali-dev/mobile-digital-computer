import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

type LogType = 'call' | 'status' | 'system' | 'user';

interface LogEntry {
  id: string;
  time: string;
  type: LogType;
  message: string;
  user?: string;
  details?: string;
}

const mockLogs: LogEntry[] = [
  { id: 'L-1', time: '13:48:24', type: 'call', message: 'Новый вызов C-1024 создан', user: 'Диспетчер #10245', details: 'ДТП на ул. Ленина, 45' },
  { id: 'L-2', time: '13:48:12', type: 'status', message: 'Экипаж NU-12 изменил статус', user: 'NU-12', details: 'Available → En Route' },
  { id: 'L-3', time: '13:45:56', type: 'call', message: 'Новый вызов C-1023 создан', user: 'Диспетчер #10245', details: 'Пожар на пр. Победы, 23' },
  { id: 'L-4', time: '13:45:30', type: 'user', message: 'Пользователь вошел в систему', user: 'Диспетчер #10245' },
  { id: 'L-5', time: '13:42:15', type: 'status', message: 'Экипаж NU-18 изменил статус', user: 'NU-18', details: 'Available → En Route' },
  { id: 'L-6', time: '13:40:08', type: 'call', message: 'Вызов C-1022 завершен', user: 'NU-15', details: 'Медицинская помощь на пр. Мира, 120' },
  { id: 'L-7', time: '13:35:22', type: 'system', message: 'Автоматическая синхронизация данных', details: 'Успешно' },
  { id: 'L-8', time: '13:30:45', type: 'status', message: 'Экипаж NU-15 изменил статус', user: 'NU-15', details: 'En Route → On Scene' },
  { id: 'L-9', time: '13:28:10', type: 'call', message: 'Новый вызов C-1022 создан', user: 'Диспетчер #10245', details: 'Медицинская помощь' },
  { id: 'L-10', time: '13:25:33', type: 'status', message: 'Экипаж NU-10 изменил статус', user: 'NU-10', details: 'On Scene → Available' },
];

const getLogTypeConfig = (type: LogType) => {
  switch (type) {
    case 'call':
      return { label: 'Вызов', icon: 'Phone', color: 'bg-primary/10 text-primary' };
    case 'status':
      return { label: 'Статус', icon: 'Activity', color: 'bg-warning/10 text-warning' };
    case 'system':
      return { label: 'Система', icon: 'Server', color: 'bg-muted text-muted-foreground' };
    case 'user':
      return { label: 'Пользователь', icon: 'User', color: 'bg-success/10 text-success' };
  }
};

const LogTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Журнал событий</CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="Поиск..." className="w-64" />
              <Icon name="Search" size={20} className="text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockLogs.map((log) => {
              const typeConfig = getLogTypeConfig(log.type);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full ${typeConfig.color} flex items-center justify-center`}>
                      <Icon name={typeConfig.icon} size={18} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{typeConfig.label}</Badge>
                          <span className="text-sm font-medium">{log.message}</span>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground">{log.details}</p>
                        )}
                        {log.user && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Icon name="User" size={12} className="inline mr-1" />
                            {log.user}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{log.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Вызовов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {mockLogs.filter(l => l.type === 'call').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Статусов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {mockLogs.filter(l => l.type === 'status').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Системных</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {mockLogs.filter(l => l.type === 'system').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {mockLogs.filter(l => l.type === 'user').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogTab;
