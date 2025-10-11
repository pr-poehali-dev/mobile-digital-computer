import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { type Crew, type Call, type User } from "@/lib/store";

interface CrewDialogsProps {
  editDialog: { open: boolean; crew: Crew | null };
  createDialog: boolean;
  manageDialog: { open: boolean; crew: Crew | null };
  deleteDialog: { open: boolean; crewId: number | null };
  assignDialog: { open: boolean; crew: Crew | null };
  formData: { status: Crew["status"]; location: string };
  crewFormData: { unitName: string; members: string[] };
  selectedCallId: string;
  availableUsers: User[];
  pendingCalls: Call[];
  onEditClose: () => void;
  onCreateClose: () => void;
  onManageClose: () => void;
  onDeleteClose: () => void;
  onAssignClose: () => void;
  onFormDataChange: (data: { status: Crew["status"]; location: string }) => void;
  onCrewFormDataChange: (data: { unitName: string; members: string[] }) => void;
  onSelectedCallChange: (callId: string) => void;
  onSaveStatus: () => void;
  onSaveManage: () => void;
  onCreateCrew: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onToggleMember: (userId: string) => void;
}

const getPriorityConfig = (priority: Call["priority"]) => {
  switch (priority) {
    case "urgent":
      return { label: "Критический", color: "text-destructive" };
    case "high":
      return { label: "Высокий", color: "text-orange-500" };
    case "medium":
      return { label: "Средний", color: "text-yellow-500" };
    case "low":
      return { label: "Низкий", color: "text-blue-500" };
  }
};

const CrewDialogs = ({
  editDialog,
  createDialog,
  manageDialog,
  deleteDialog,
  assignDialog,
  formData,
  crewFormData,
  selectedCallId,
  availableUsers,
  pendingCalls,
  onEditClose,
  onCreateClose,
  onManageClose,
  onDeleteClose,
  onAssignClose,
  onFormDataChange,
  onCrewFormDataChange,
  onSelectedCallChange,
  onSaveStatus,
  onSaveManage,
  onCreateCrew,
  onDelete,
  onAssign,
  onToggleMember,
}: CrewDialogsProps) => {
  return (
    <>
      <Dialog open={editDialog.open} onOpenChange={onEditClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Управление статусом {editDialog.crew?.unitName}
            </DialogTitle>
            <DialogDescription>
              Измените статус и местоположение экипажа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Crew["status"]) =>
                  onFormDataChange({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="en-route">В пути</SelectItem>
                  <SelectItem value="on-scene">На месте</SelectItem>
                  <SelectItem value="unavailable">Недоступен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Местоположение</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  onFormDataChange({ ...formData, location: e.target.value })
                }
                placeholder="Станция №1, ул. Ленина, 45..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onEditClose}>
              Отмена
            </Button>
            <Button onClick={onSaveStatus}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialog} onOpenChange={onCreateClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать экипаж</DialogTitle>
            <DialogDescription>
              Укажите название и выберите сотрудников
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitName">Название экипажа *</Label>
              <Input
                id="unitName"
                value={crewFormData.unitName}
                onChange={(e) =>
                  onCrewFormDataChange({
                    ...crewFormData,
                    unitName: e.target.value,
                  })
                }
                placeholder="Например: L-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Сотрудники (доступно: {availableUsers.length}) *</Label>
              {(() => {
                console.log("Create dialog - availableUsers state:", availableUsers);
                return null;
              })()}
              {availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет доступных сотрудников для формирования экипажа
                </p>
              ) : (
                <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-${user.id}`}
                        checked={crewFormData.members.includes(user.id)}
                        onCheckedChange={() => onToggleMember(user.id)}
                      />
                      <label
                        htmlFor={`create-${user.id}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {user.fullName}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          #{user.id}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCreateClose}>
              Отмена
            </Button>
            <Button onClick={onCreateCrew}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageDialog.open} onOpenChange={onManageClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать экипаж</DialogTitle>
            <DialogDescription>
              Измените название и состав экипажа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-unitName">Название экипажа *</Label>
              <Input
                id="edit-unitName"
                value={crewFormData.unitName}
                onChange={(e) =>
                  onCrewFormDataChange({
                    ...crewFormData,
                    unitName: e.target.value,
                  })
                }
                placeholder="Например: L-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Сотрудники (доступно: {availableUsers.length}) *</Label>
              {availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет доступных сотрудников для формирования экипажа
                </p>
              ) : (
                <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${user.id}`}
                        checked={crewFormData.members.includes(user.id)}
                        onCheckedChange={() => onToggleMember(user.id)}
                      />
                      <label
                        htmlFor={`edit-${user.id}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {user.fullName}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          #{user.id}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onManageClose}>
              Отмена
            </Button>
            <Button onClick={onSaveManage}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialog.open} onOpenChange={onAssignClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Назначить экипаж {assignDialog.crew?.unitName} на вызов
            </DialogTitle>
            <DialogDescription>
              Выберите вызов для назначения экипажа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pendingCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="FileX" size={48} className="mx-auto mb-3 opacity-50" />
                <p>Нет ожидающих вызовов</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Активные вызовы ({pendingCalls.length})</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                  {pendingCalls.map((call) => {
                    const priorityConfig = getPriorityConfig(call.priority);
                    return (
                      <div
                        key={call.id}
                        onClick={() => onSelectedCallChange(call.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedCallId === call.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {call.id}
                            </Badge>
                            <Badge className={priorityConfig.color}>
                              {priorityConfig.label}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {call.time}
                          </span>
                        </div>
                        <p className="font-medium mb-1">{call.type}</p>
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Icon name="MapPin" size={14} className="mt-0.5" />
                          <span>{call.address}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onAssignClose}>
              Отмена
            </Button>
            <Button onClick={onAssign} disabled={!selectedCallId}>
              <Icon name="Send" size={16} className="mr-2" />
              Назначить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={onDeleteClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить экипаж?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя будет отменить. Экипаж будет удален из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CrewDialogs;
