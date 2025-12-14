import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { type User } from '@/lib/auth';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';

interface UserActionsDialogsProps {
  deleteDialog: { open: boolean; userId: string | null };
  freezeDialog: { open: boolean; user: User | null; action: 'freeze' | 'unfreeze' };
  passwordDialog: { open: boolean; user: User | null };
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onFreezeConfirm: () => void;
  onFreezeCancel: () => void;
  onPasswordClose: () => void;
}

const UserActionsDialogs = ({
  deleteDialog,
  freezeDialog,
  passwordDialog,
  onDeleteConfirm,
  onDeleteCancel,
  onFreezeConfirm,
  onFreezeCancel,
  onPasswordClose
}: UserActionsDialogsProps) => {
  return (
    <>
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && onDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все данные пользователя будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={freezeDialog.open} onOpenChange={(open) => !open && onFreezeCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {freezeDialog.action === 'freeze' ? 'Заморозить аккаунт?' : 'Разморозить аккаунт?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {freezeDialog.action === 'freeze' 
                ? `${freezeDialog.user?.fullName} не сможет войти в систему до разморозки.`
                : `${freezeDialog.user?.fullName} снова получит доступ к системе.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onFreezeConfirm}>
              {freezeDialog.action === 'freeze' ? 'Заморозить' : 'Разморозить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {passwordDialog.user && (
        <ChangePasswordDialog
          user={passwordDialog.user}
          open={passwordDialog.open}
          onOpenChange={(open) => !open && onPasswordClose()}
        />
      )}
    </>
  );
};

export default UserActionsDialogs;
