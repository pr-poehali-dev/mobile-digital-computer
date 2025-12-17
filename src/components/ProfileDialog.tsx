import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/auth";
import ChangePasswordDialog from "./ChangePasswordDialog";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case "manager":
      return "Менеджер";
    case "dispatcher":
      return "Диспетчер";
    case "supervisor":
      return "Руководитель";
    case "employee":
      return "Сотрудник";
    default:
      return role;
  }
};

const ProfileDialog = ({ open, onOpenChange, user }: ProfileDialogProps) => {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="User" size={20} />
              Профиль пользователя
            </DialogTitle>
            <DialogDescription>Информация о вашем аккаунте</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ID</Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-lg font-mono px-4 py-2"
                >
                  #{user.id}
                </Badge>
                <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Имя и фамилия</Label>
              <Input value={user.fullName} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPasswordDialogOpen(true);
                  onOpenChange(false);
                }}
              >
                <Icon name="KeyRound" size={16} className="mr-2" />
                Изменить пароль
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Icon name="Info" size={16} className="text-muted-foreground" />
                <span>Информация</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Для изменения данных профиля обратитесь к руководителю или
                менеджеру системы
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ChangePasswordDialog
        user={user}
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </>
  );
};

export default ProfileDialog;