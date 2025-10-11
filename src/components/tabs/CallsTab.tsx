import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCalls, deleteCall, updateCallDispatcher, getAllUsers, type Call } from '@/lib/store';
import { canDeleteCalls, canEditDispatchers } from '@/lib/permissions';
import { type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface CallsTabProps {
  currentUser: User | null;
}

const getPriorityConfig = (priority: Call['priority']) => {
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

const getStatusConfig = (status: Call['status']) => {
  switch (status) {
    case 'pending':
      return { label: 'Ожидает', color: 'text-warning' };
    case 'dispatched':
      return { label: 'Назначен', color: 'text-primary' };
    case 'completed':
      return { label: 'Завершен', color: 'text-success' };
  }
};

const CallsTab = ({ currentUser }: CallsTabProps) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [dispatchers, setDispatchers] = useState<User[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; callId: string | null }>({ open: false, callId: null });
  const { toast } = useToast();

  useEffect(() => {
    setCalls(getCalls());
    setDispatchers(getAllUsers().filter(u => u.role === 'dispatcher'));
  }, []);

  const handleDelete = (callId: string) => {
    deleteCall(callId);
    setCalls(getCalls());
    setDeleteDialog({ open: false, callId: null });
    toast({
      title: 'Вызов удален',
      description: `Вызов ${callId} успешно удален из системы`,
    });
  };

  const handleDispatcherChange = (callId: string, dispatcherId: string) => {
    const dispatcher = dispatchers.find(d => d.id === parseInt(dispatcherId));
    if (dispatcher) {
      updateCallDispatcher(callId, dispatcher.id, dispatcher.fullName);
      setCalls(getCalls());
      toast({
        title: 'Диспетчер изменен',
        description: `Вызов ${callId} назначен на ${dispatcher.fullName}`,
      });
    }
  };

  const pendingCount = calls.filter(c => c.status === 'pending').length;
  const activeCount = calls.filter(c => c.status === 'dispatched').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего вызовов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calls.length}</div>
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
                  {canEditDispatchers(currentUser) && <TableHead>Диспетчер</TableHead>}
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => {
                  const priorityConfig = getPriorityConfig(call.priority);
                  const statusConfig = getStatusConfig(call.status);
                  return (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.id}</TableCell>
                      <TableCell>{call.time}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{call.address}</TableCell>
                      <TableCell>{call.type}</TableCell>
                      <TableCell>
                        <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                      </TableCell>
                      <TableCell>{call.assignedUnit || '—'}</TableCell>
                      {canEditDispatchers(currentUser) && (
                        <TableCell>
                          <Select 
                            value={call.dispatcherId?.toString()} 
                            onValueChange={(value) => handleDispatcherChange(call.id, value)}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Не назначен" />
                            </SelectTrigger>
                            <SelectContent>
                              {dispatchers.map(d => (
                                <SelectItem key={d.id} value={d.id.toString()}>
                                  {d.fullName.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Icon name="Eye" size={16} />
                          </Button>
                          {canDeleteCalls(currentUser) && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeleteDialog({ open: true, callId: call.id })}
                            >
                              <Icon name="Trash2" size={16} className="text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, callId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить вызов?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить вызов {deleteDialog.callId}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialog.callId && handleDelete(deleteDialog.callId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CallsTab;
