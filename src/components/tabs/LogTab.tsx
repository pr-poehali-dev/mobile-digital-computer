import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { getActivityLogs, deleteActivityLog, deleteActivityLogs, clearAllActivityLogs, type ActivityLog } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';
import { useToast } from '@/hooks/use-toast';
import { type User } from '@/lib/auth';

interface LogTabProps {
  currentUser?: User | null;
}

const getLogTypeConfig = (type: ActivityLog['type']) => {
  switch (type) {
    case 'call_assigned':
    case 'call_completed':
      return { label: 'Вызов', icon: 'Phone', color: 'bg-primary/10 text-primary' };
    case 'crew_status':
      return { label: 'Статус', icon: 'Activity', color: 'bg-warning/10 text-warning' };
    case 'crew_created':
    case 'crew_deleted':
      return { label: 'Экипаж', icon: 'Users', color: 'bg-success/10 text-success' };
    case 'panic_activated':
      return { label: 'ТРЕВОГА', icon: 'AlertTriangle', color: 'bg-red-100 text-red-700 border-red-500' };
    case 'panic_reset':
      return { label: 'Сброс тревоги', icon: 'XCircle', color: 'bg-gray-100 text-gray-700' };
    case 'signal100_activated':
      return { label: 'СИГНАЛ 100', icon: 'Radio', color: 'bg-yellow-100 text-yellow-700 border-yellow-500' };
    case 'signal100_reset':
      return { label: 'Отмена сигнала 100', icon: 'RadioOff', color: 'bg-gray-100 text-gray-700' };
    default:
      return { label: 'Событие', icon: 'Info', color: 'bg-gray-100 text-gray-700' };
  }
};

const LogTab = ({ currentUser }: LogTabProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'panic'>('all');
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'one' | 'selected' | 'all'; logId?: string }>({ 
    open: false, 
    type: 'one' 
  });
  const { toast } = useToast();
  const canManage = currentUser?.role === 'manager' || currentUser?.role === 'supervisor';

  const loadLogs = () => {
    setLogs(getActivityLogs());
  };

  useSync(['logs_updated'], loadLogs, 2000);

  const filteredLogs = logs.filter(log => {
    if (filterType === 'panic' && log.type !== 'panic_activated' && log.type !== 'panic_reset') {
      return false;
    }
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.description.toLowerCase().includes(search) ||
      log.userName.toLowerCase().includes(search) ||
      log.crewName?.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search)
    );
  });

  const panicLogsCount = logs.filter(log => log.type === 'panic_activated' || log.type === 'panic_reset').length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLogs(new Set(filteredLogs.map(log => log.id)));
    } else {
      setSelectedLogs(new Set());
    }
  };

  const handleSelectLog = (logId: string, checked: boolean) => {
    const newSelected = new Set(selectedLogs);
    if (checked) {
      newSelected.add(logId);
    } else {
      newSelected.delete(logId);
    }
    setSelectedLogs(newSelected);
  };

  const handleDelete = () => {
    if (deleteDialog.type === 'one' && deleteDialog.logId) {
      deleteActivityLog(deleteDialog.logId);
      toast({ title: 'Запись удалена', description: 'Запись успешно удалена из журнала' });
    } else if (deleteDialog.type === 'selected') {
      deleteActivityLogs(Array.from(selectedLogs));
      setSelectedLogs(new Set());
      toast({ 
        title: 'Записи удалены', 
        description: `Удалено записей: ${selectedLogs.size}` 
      });
    } else if (deleteDialog.type === 'all') {
      clearAllActivityLogs();
      setSelectedLogs(new Set());
      toast({ title: 'Журнал очищен', description: 'Все записи успешно удалены' });
    }
    setDeleteDialog({ open: false, type: 'one' });
  };

  const allSelected = filteredLogs.length > 0 && selectedLogs.size === filteredLogs.length;
  const someSelected = selectedLogs.size > 0 && selectedLogs.size < filteredLogs.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Журнал активности</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Все записи ({logs.length})
                </Button>
                <Button
                  variant={filterType === 'panic' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('panic')}
                  className="gap-2"
                >
                  <Icon name="AlertTriangle" size={16} />
                  Сигналы тревоги ({panicLogsCount})
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input 
                  placeholder="Поиск..." 
                  className="w-64 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Icon name="Search" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              {canManage && (
                <>
                  {selectedLogs.size > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, type: 'selected' })}
                    >
                      <Icon name="Trash2" size={16} className="mr-2" />
                      Удалить ({selectedLogs.size})
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDeleteDialog({ open: true, type: 'all' })}
                    disabled={logs.length === 0}
                  >
                    <Icon name="Trash2" size={16} className="mr-2" />
                    Очистить всё
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Ничего не найдено' : 'Журнал пуст'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {canManage && (
                <div className="flex items-center gap-2 p-3 border-b mb-4">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el) {
                        (el as any).indeterminate = someSelected;
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedLogs.size > 0 
                      ? `Выбрано: ${selectedLogs.size} из ${filteredLogs.length}`
                      : 'Выбрать все'
                    }
                  </span>
                </div>
              )}
              
              {filteredLogs.map((log) => {
                const typeConfig = getLogTypeConfig(log.type);
                const isPanic = log.type === 'panic_activated';
                const isPanicReset = log.type === 'panic_reset';
                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      isPanic ? 'border-red-500 bg-red-50 border-2' : ''
                    } ${isPanicReset ? 'border-gray-400 bg-gray-50' : ''}`}
                  >
                    {canManage && (
                      <div className="flex-shrink-0 pt-1">
                        <Checkbox
                          checked={selectedLogs.has(log.id)}
                          onCheckedChange={(checked) => handleSelectLog(log.id, checked as boolean)}
                        />
                      </div>
                    )}
                    
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full ${typeConfig.color} flex items-center justify-center`}>
                        <Icon name={typeConfig.icon} size={18} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge 
                              variant={isPanic ? 'destructive' : 'outline'} 
                              className={`text-xs ${isPanic ? 'animate-pulse font-bold' : ''}`}
                            >
                              {typeConfig.label}
                            </Badge>
                            <span className={`text-sm ${isPanic ? 'font-bold text-red-900' : 'font-medium'}`}>
                              {log.description}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-sm text-muted-foreground">{log.details}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Icon name="User" size={12} />
                              {log.userName}
                            </div>
                            {log.crewName && (
                              <div className="flex items-center gap-1">
                                <Icon name="Users" size={12} />
                                {log.crewName}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Icon name="Clock" size={12} />
                              {new Date(log.timestamp).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => setDeleteDialog({ open: true, type: 'one', logId: log.id })}
                          >
                            <Icon name="Trash2" size={16} className="text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего записей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">За сегодня</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => {
                const logDate = new Date(log.timestamp);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Типы событий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(
                logs.reduce((acc, log) => {
                  const type = getLogTypeConfig(log.type).label;
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{type}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog.type === 'all' && 'Очистить весь журнал?'}
              {deleteDialog.type === 'selected' && `Удалить выбранные записи (${selectedLogs.size})?`}
              {deleteDialog.type === 'one' && 'Удалить запись?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'all' && 'Все записи журнала будут безвозвратно удалены. Это действие нельзя отменить.'}
              {deleteDialog.type === 'selected' && 'Выбранные записи будут безвозвратно удалены. Это действие нельзя отменить.'}
              {deleteDialog.type === 'one' && 'Запись будет безвозвратно удалена. Это действие нельзя отменить.'}
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

export default LogTab;