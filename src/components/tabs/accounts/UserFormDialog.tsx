import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type User } from '@/lib/auth';
import { sanitizeName, sanitizeEmail, sanitizeId } from '@/lib/sanitize';

interface UserFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  user: User | null;
  formData: {
    userId: string;
    password: string;
    fullName: string;
    email: string;
    role: User['role'];
  };
  onFormDataChange: (data: Partial<UserFormDialogProps['formData']>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const UserFormDialog = ({ open, mode, user, formData, onFormDataChange, onSave, onCancel }: UserFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Создать аккаунт' : 'Редактировать аккаунт'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Заполните данные для нового пользователя'
              : 'Измените данные пользователя'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">ID (5 цифр)</Label>
            <Input
              id="userId"
              placeholder="12345"
              value={formData.userId}
              onChange={(e) => onFormDataChange({ userId: sanitizeId(e.target.value) })}
              maxLength={5}
            />
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="password">Пароль (мин. 6 символов)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={(e) => onFormDataChange({ password: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">ФИО</Label>
            <Input
              id="fullName"
              placeholder="Иванов Иван Иванович"
              value={formData.fullName}
              onChange={(e) => onFormDataChange({ fullName: sanitizeName(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => onFormDataChange({ email: sanitizeEmail(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <Select value={formData.role} onValueChange={(value) => onFormDataChange({ role: value as User['role'] })}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Менеджер</SelectItem>
                <SelectItem value="supervisor">Руководитель</SelectItem>
                <SelectItem value="dispatcher">Диспетчер</SelectItem>
                <SelectItem value="employee">Сотрудник</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={onSave}>
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
