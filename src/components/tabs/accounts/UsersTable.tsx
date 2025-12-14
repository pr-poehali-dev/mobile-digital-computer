import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { canFreezeUser } from '@/lib/permissions';

interface UsersTableProps {
  users: User[];
  currentUser: User | null;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onFreezeToggle: (user: User) => void;
  onChangePassword: (user: User) => void;
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'manager': return 'Менеджер';
    case 'dispatcher': return 'Диспетчер';
    case 'supervisor': return 'Руководитель';
    case 'employee': return 'Сотрудник';
    default: return role;
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'manager': return 'default';
    case 'supervisor': return 'default';
    case 'dispatcher': return 'secondary';
    case 'employee': return 'outline';
    default: return 'outline';
  }
};

const UsersTable = ({ users, currentUser, onEdit, onDelete, onFreezeToggle, onChangePassword }: UsersTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>ФИО</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Пользователи не найдены
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono">#{user.id}</TableCell>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role) as any}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.frozen ? (
                    <Badge variant="destructive" className="gap-1">
                      <Icon name="Snowflake" size={12} />
                      Заморожен
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-success border-success">
                      <Icon name="CheckCircle2" size={12} />
                      Активен
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangePassword(user)}
                    >
                      <Icon name="Key" size={16} />
                    </Button>
                    {currentUser && canFreezeUser(currentUser, user) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFreezeToggle(user)}
                      >
                        <Icon name={user.frozen ? "Flame" : "Snowflake"} size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user.id)}
                      disabled={user.id === currentUser?.id}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;
