import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type CallPriority = 'urgent' | 'high' | 'medium' | 'low';
type CallStatus = 'pending' | 'dispatched' | 'completed';

interface Call {
  id: string;
  time: string;
  address: string;
  type: string;
  priority: CallPriority;
  status: CallStatus;
  assignedUnit?: string;
}

const mockCalls: Call[] = [
  { id: 'C-1024', time: '13:48', address: 'ул. Ленина, 45', type: 'ДТП', priority: 'urgent', status: 'dispatched', assignedUnit: 'NU-12' },
  { id: 'C-1023', time: '13:45', address: 'пр. Победы, 23', type: 'Пожар', priority: 'urgent', status: 'pending' },
  { id: 'C-1022', time: '13:30', address: 'пр. Мира, 120', type: 'Медицинская помощь', priority: 'high', status: 'dispatched', assignedUnit: 'NU-15' },
  { id: 'C-1021', time: '13:15', address: 'ул. Советская, 78', type: 'Проверка сигнализации', priority: 'medium', status: 'completed', assignedUnit: 'NU-10' },
  { id: 'C-1020', time: '13:00', address: 'ул. Гагарина, 156', type: 'Медицинская помощь', priority: 'high', status: 'completed', assignedUnit: 'NU-07' },
];

const getPriorityConfig = (priority: CallPriority) => {
  switch (priority) {
    case 'urgent':
      return { label: 'Срочно', variant: 'destructive' as const };
    case 'high':
      return { label: 'Высокий', variant: 'default' as const };
    case 'medium':
      return { label: 'Средний', variant: 'secondary' as const };
    case 'low':
      return { label: 'Низкий', variant: 'outline' as const };
  }
};

const getStatusConfig = (status: CallStatus) => {
  switch (status) {
    case 'pending':
      return { label: 'Ожидает', color: 'text-warning' };
    case 'dispatched':
      return { label: 'Назначен', color: 'text-primary' };
    case 'completed':
      return { label: 'Завершен', color: 'text-success' };
  }
};

const CallsTab = () => {
  const pendingCount = mockCalls.filter(c => c.status === 'pending').length;
  const activeCount = mockCalls.filter(c => c.status === 'dispatched').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего вызовов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockCalls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ожидают</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">В работе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>История вызовов</CardTitle>
            <Button size="sm">
              <Icon name="Plus" size={16} className="mr-2" />
              Новый вызов
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Экипаж</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCalls.map((call) => {
                  const priorityConfig = getPriorityConfig(call.priority);
                  const statusConfig = getStatusConfig(call.status);
                  return (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.id}</TableCell>
                      <TableCell>{call.time}</TableCell>
                      <TableCell>{call.address}</TableCell>
                      <TableCell>{call.type}</TableCell>
                      <TableCell>
                        <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                      </TableCell>
                      <TableCell>{call.assignedUnit || '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Icon name="Eye" size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallsTab;
