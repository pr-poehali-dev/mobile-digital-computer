import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { getAllUsers, assignTest, getUserTestAssignments, type Test } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface TestAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test | null;
  currentUser: User | null;
}

const TestAssignDialog = ({ open, onOpenChange, test, currentUser }: TestAssignDialogProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setUsers(getAllUsers().filter(u => u.role !== 'manager' && !u.frozen));
      setSelectedUsers([]);
      setDueDate('');
    }
  }, [open]);

  const handleToggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleAssign = () => {
    if (!test || !currentUser || selectedUsers.length === 0) return;

    let successCount = 0;
    let skipCount = 0;

    selectedUsers.forEach(userId => {
      const existing = getUserTestAssignments(userId).find(
        a => a.testId === test.id && (a.status === 'pending' || a.status === 'in-progress')
      );

      if (!existing) {
        assignTest(test.id, userId, currentUser.id, dueDate || undefined);
        successCount++;
      } else {
        skipCount++;
      }
    });

    toast({
      title: 'Тест назначен',
      description: `Назначено: ${successCount}${skipCount > 0 ? `, пропущено: ${skipCount} (уже назначен)` : ''}`
    });

    onOpenChange(false);
  };

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="UserPlus" size={20} />
            Назначить тест
          </DialogTitle>
          <DialogDescription>
            {test.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dueDate">Срок выполнения (необязательно)</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Выберите сотрудников ({selectedUsers.length} выбрано)</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Нет доступных сотрудников
                </p>
              ) : (
                users.map(user => {
                  const existingAssignment = getUserTestAssignments(user.id).find(
                    a => a.testId === test.id && (a.status === 'pending' || a.status === 'in-progress')
                  );

                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                          disabled={!!existingAssignment}
                        />
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {existingAssignment && (
                          <Badge variant="secondary">
                            {existingAssignment.status === 'pending' ? 'Ожидает' : 'Выполняется'}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {user.role === 'dispatcher' ? 'Диспетчер' : 
                           user.role === 'supervisor' ? 'Руководитель' : 'Сотрудник'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={selectedUsers.length === 0}
          >
            <Icon name="Check" size={16} className="mr-2" />
            Назначить ({selectedUsers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestAssignDialog;
