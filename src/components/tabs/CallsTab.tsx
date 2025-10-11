import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCalls, deleteCall, deleteCalls, clearAllCalls, updateCallDispatcher, updateCallStatus, createCall, assignCrewToCall, getCrews, getAllUsers, type Call, type Crew } from '@/lib/store';
import { canDeleteCalls, canEditDispatchers } from '@/lib/permissions';
import { type User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useSync } from '@/hooks/use-sync';
import { sanitizeAddress, sanitizeText } from '@/lib/sanitize';

interface CallsTabProps {
  currentUser: User | null;
}

const getPriorityConfig = (priority: Call['priority']) => {
  switch (priority) {
    case 'code99':
      return { label: 'Код 99', variant: 'destructive' as const, color: 'bg-red-500 hover:bg-red-600' };
    case 'code3':
      return { label: 'Код 3', variant: 'default' as const, color: 'bg-yellow-500 hover:bg-yellow-600' };
    case 'code2':
      return { label: 'Код 2', variant: 'secondary' as const, color: 'bg-green-500 hover:bg-green-600' };
    default:
      return { label: 'Код 2', variant: 'secondary' as const, color: 'bg-green-500 hover:bg-green-600' };
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
  const [crews, setCrews] = useState<Crew[]>([]);
  const [dispatchers, setDispatchers] = useState<User[]>([]);
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'one' | 'selected' | 'all'; callId?: string }>({ open: false, type: 'one' });
  const [createDialog, setCreateDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; callId: string | null }>({ open: false, callId: null });
  const [formData, setFormData] = useState({
    address: '',
    type: '',
    priority: 'code2' as Call['priority'],
    status: 'pending' as Call['status']
  });
  const { toast } = useToast();

  const loadData = () => {
    setCalls(getCalls());
    setCrews(getCrews());
    setDispatchers(getAllUsers().filter(u => u.role === 'dispatcher'));
  };

  useSync(['calls_updated', 'crews_updated'], loadData, 2000);

  const handleDelete = () => {
    if (deleteDialog.type === 'one' && deleteDialog.callId) {
      deleteCall(deleteDialog.callId);
      toast({ title: 'Вызов удален', description: 'Вызов успешно удален из системы' });
    } else if (deleteDialog.type === 'selected') {
      deleteCalls(Array.from(selectedCalls));
      setSelectedCalls(new Set());
      toast({ title: 'Вызовы удалены', description: `Удалено вызовов: ${selectedCalls.size}` });
    } else if (deleteDialog.type === 'all') {
      clearAllCalls();
      setSelectedCalls(new Set());
      toast({ title: 'Все вызовы удалены', description: 'История вызовов полностью очищена' });
    }
    setDeleteDialog({ open: false, type: 'one' });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCalls(new Set(calls.map(call => call.id)));
    } else {
      setSelectedCalls(new Set());
    }
  };

  const handleSelectCall = (callId: string, checked: boolean) => {
    const newSelected = new Set(selectedCalls);
    if (checked) {
      newSelected.add(callId);
    } else {
      newSelected.delete(callId);
    }
    setSelectedCalls(newSelected);
  };

  const handleDispatcherChange = (callId: string, dispatcherId: string) => {
    const dispatcher = dispatchers.find(d => d.id === dispatcherId);
    if (dispatcher) {
      updateCallDispatcher(callId, dispatcher.id, dispatcher.fullName);
      loadData();
      toast({
        title: 'Диспетчер изменен',
        description: `Вызов ${callId} назначен на ${dispatcher.fullName}`,
      });
    }
  };

  const handleCreateCall = () => {
    if (!formData.address || !formData.type) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    const newCall = createCall({
      ...formData
    }, currentUser?.id);
    
    loadData();
    setCreateDialog(false);
    setFormData({ address: '', type: '', priority: 'code2', status: 'pending' });
    
    toast({
      title: 'Вызов создан',
      description: `Новый вызов ${newCall.id} успешно добавлен`,
    });
  };

  const handleAssignCrew = (crewId: string) => {
    if (assignDialog.callId) {
      assignCrewToCall(assignDialog.callId, parseInt(crewId), currentUser?.id);
      loadData();
      setAssignDialog({ open: false, callId: null });
      toast({
        title: 'Экипаж назначен',
        description: 'Экипаж успешно назначен на вызов',
      });
    }
  };

  const handleCompleteCall = (callId: string) => {
    updateCallStatus(callId, 'completed');
    loadData();
    toast({
      title: 'Вызов завершен',
      description: `Вызов ${callId} отмечен как завершенный`,
    });
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>История вызовов</CardTitle>
            <div className="flex items-center gap-2">
              {canDeleteCalls(currentUser) && selectedCalls.size > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setDeleteDialog({ open: true, type: 'selected' })}
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Удалить ({selectedCalls.size})
                </Button>
              )}
              {canDeleteCalls(currentUser) && calls.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDeleteDialog({ open: true, type: 'all' })}
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Очистить всё
                </Button>
              )}
              <Button size="sm" onClick={() => setCreateDialog(true)}>
                <Icon name="Plus" size={16} className="mr-2" />
                Новый вызов
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {canDeleteCalls(currentUser) && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={calls.length > 0 && selectedCalls.size === calls.length}
                        onCheckedChange={handleSelectAll}
                        ref={(el) => {
                          if (el) {
                            (el as any).indeterminate = selectedCalls.size > 0 && selectedCalls.size < calls.length;
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>ID</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Экипаж</TableHead>
                  {canEditDispatchers(currentUser) && <TableHead>Диспетчер</TableHead>}
                  <TableHead className="w-[200px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => {
                  const priorityConfig = getPriorityConfig(call.priority);
                  const statusConfig = getStatusConfig(call.status);
                  return (
                    <TableRow key={call.id}>
                      {canDeleteCalls(currentUser) && (
                        <TableCell>
                          <Checkbox
                            checked={selectedCalls.has(call.id)}
                            onCheckedChange={(checked) => handleSelectCall(call.id, checked as boolean)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{call.id}</TableCell>
                      <TableCell>{call.time}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{call.address}</TableCell>
                      <TableCell>{call.type}</TableCell>
                      <TableCell>
                        <Badge className={priorityConfig.color + ' text-white border-0'}>{priorityConfig.label}</Badge>
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
                          {call.status !== 'completed' && (
                            <>
                              {call.status === 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setAssignDialog({ open: true, callId: call.id })}
                                >
                                  <Icon name="UserPlus" size={16} className="mr-1" />
                                  Назначить
                                </Button>
                              )}
                              {call.status === 'dispatched' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleCompleteCall(call.id)}
                                >
                                  <Icon name="CheckCircle2" size={16} className="mr-1" />
                                  Завершить
                                </Button>
                              )}
                            </>
                          )}
                          {canDeleteCalls(currentUser) && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeleteDialog({ open: true, type: 'one', callId: call.id })}
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

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый вызов</DialogTitle>
            <DialogDescription>
              Заполните информацию о новом вызове
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Адрес *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: sanitizeAddress(e.target.value) })}
                placeholder="ул. Ленина, 45"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Тип вызова *</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: sanitizeText(e.target.value) })}
                placeholder="ДТП, Пожар, Медицинская помощь..."
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select value={formData.priority} onValueChange={(value: Call['priority']) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code2">Код 2 (зелёный)</SelectItem>
                  <SelectItem value="code3">Код 3 (жёлтый)</SelectItem>
                  <SelectItem value="code99">Код 99 (красный)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateCall}>
              Создать вызов
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ open, callId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить экипаж</DialogTitle>
            <DialogDescription>
              Выберите доступный экипаж для вызова {assignDialog.callId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {crews.filter(c => c.status === 'available').length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет доступных экипажей</p>
            ) : (
              <div className="grid gap-2">
                {crews.filter(c => c.status === 'available').map(crew => (
                  <Button
                    key={crew.id}
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={() => handleAssignCrew(crew.id.toString())}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon name="Ambulance" size={20} />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{crew.unitName}</div>
                        <div className="text-sm text-muted-foreground">{crew.location}</div>
                      </div>
                      <Badge variant="default">Доступен</Badge>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, callId: null })}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog.type === 'all' && 'Удалить все вызовы?'}
              {deleteDialog.type === 'selected' && `Удалить выбранные вызовы (${selectedCalls.size})?`}
              {deleteDialog.type === 'one' && 'Удалить вызов?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'all' && 'Вся история вызовов будет безвозвратно удалена. Это действие нельзя отменить.'}
              {deleteDialog.type === 'selected' && 'Выбранные вызовы будут безвозвратно удалены. Это действие нельзя отменить.'}
              {deleteDialog.type === 'one' && `Вы уверены, что хотите удалить вызов ${deleteDialog.callId}? Это действие нельзя отменить.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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