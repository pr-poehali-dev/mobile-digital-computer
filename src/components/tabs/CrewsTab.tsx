import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import {
  getCrews,
  updateCrewStatus,
  createCrew,
  updateCrew,
  deleteCrew,
  getAvailableCrewMembers,
  getAllUsers,
  getCalls,
  assignCrewToCall,
  activatePanic,
  resetPanic,
  type Crew,
} from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useSync } from "@/hooks/use-sync";
import { type User } from '@/lib/auth';
import CrewCard from "./crews/CrewCard";
import CrewDialogs from "./crews/CrewDialogs";

interface CrewsTabProps {
  currentUser: User | null;
}

const CrewsTab = ({ currentUser }: CrewsTabProps) => {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [calls, setCalls] = useState<ReturnType<typeof getCalls>>([]);
  const [availableUsers, setAvailableUsers] = useState<ReturnType<typeof getAvailableCrewMembers>>([]);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    crew: Crew | null;
  }>({ open: false, crew: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [manageDialog, setManageDialog] = useState<{
    open: boolean;
    crew: Crew | null;
  }>({ open: false, crew: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    crewId: number | null;
  }>({ open: false, crewId: null });
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    crew: Crew | null;
  }>({ open: false, crew: null });
  const [selectedCallId, setSelectedCallId] = useState<string>("");
  const [formData, setFormData] = useState({
    status: "available" as Crew["status"],
    location: "",
  });
  const [crewFormData, setCrewFormData] = useState({
    unitName: "",
    members: [] as string[],
  });
  const { toast } = useToast();

  const loadAll = () => {
    loadCrews();
    loadCalls();
    loadAvailableUsers();
  };

  useSync(['crews_updated', 'online_users_changed', 'calls_updated'], loadAll, 2000);

  const loadCrews = () => {
    const loadedCrews = getCrews();
    console.log('[CrewsTab] loadCrews вызван, получено экипажей:', loadedCrews.length, loadedCrews);
    setCrews(loadedCrews);
  };

  const loadCalls = () => {
    setCalls(getCalls());
  };

  const loadAvailableUsers = () => {
    setAvailableUsers(getAvailableCrewMembers());
  };

  const handleEdit = (crew: Crew) => {
    setFormData({
      status: crew.status,
      location: crew.location || "",
    });
    setEditDialog({ open: true, crew });
  };

  const handleManage = (crew: Crew) => {
    setCrewFormData({
      unitName: crew.unitName,
      members: crew.members || [],
    });
    setManageDialog({ open: true, crew });
  };

  const handleCreate = () => {
    setCrewFormData({
      unitName: "",
      members: [],
    });
    loadAvailableUsers();
    setCreateDialog(true);
  };

  const handleSaveStatus = async () => {
    if (editDialog.crew) {
      await updateCrewStatus(editDialog.crew.id, formData.status, formData.location, currentUser?.id);
      loadCrews();
      setEditDialog({ open: false, crew: null });
      toast({
        title: "Статус обновлен",
        description: `Экипаж ${editDialog.crew.unitName} успешно обновлен`,
      });
    }
  };

  const handleSaveManage = async () => {
    if (manageDialog.crew) {
      if (crewFormData.members.length === 0) {
        toast({
          title: "Ошибка",
          description: "Выберите хотя бы одного сотрудника",
          variant: "destructive",
        });
        return;
      }
      await updateCrew(
        manageDialog.crew.id,
        crewFormData.unitName,
        crewFormData.members,
      );
      loadCrews();
      setManageDialog({ open: false, crew: null });
      toast({
        title: "Экипаж обновлен",
        description: `Экипаж ${crewFormData.unitName} успешно обновлен`,
      });
    }
  };

  const handleCreateCrew = async () => {
    if (!crewFormData.unitName) {
      toast({
        title: "Ошибка",
        description: "Введите название экипажа",
        variant: "destructive",
      });
      return;
    }
    if (crewFormData.members.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одного сотрудника",
        variant: "destructive",
      });
      return;
    }
    await createCrew(crewFormData.unitName, crewFormData.members, currentUser?.id);
    loadCrews();
    setCreateDialog(false);
    toast({
      title: "Экипаж создан",
      description: `Экипаж ${crewFormData.unitName} успешно добавлен`,
    });
  };

  const handleDelete = async () => {
    if (deleteDialog.crewId) {
      await deleteCrew(deleteDialog.crewId, currentUser?.id);
      loadCrews();
      setDeleteDialog({ open: false, crewId: null });
      toast({
        title: "Экипаж удален",
        description: "Экипаж удален из системы",
      });
    }
  };

  const handleAssign = (crew: Crew) => {
    setSelectedCallId("");
    setAssignDialog({ open: true, crew });
  };

  const handleAssignToCall = () => {
    if (assignDialog.crew && selectedCallId) {
      assignCrewToCall(selectedCallId, assignDialog.crew.id, currentUser?.id);
      updateCrewStatus(assignDialog.crew.id, "en-route", undefined, currentUser?.id);
      loadCrews();
      loadCalls();
      setAssignDialog({ open: false, crew: null });
      toast({
        title: "Экипаж назначен",
        description: `${assignDialog.crew.unitName} направлен на вызов`,
      });
    }
  };

  const handleStatusChange = (crewId: number, status: Crew["status"]) => {
    updateCrewStatus(crewId, status, undefined, currentUser?.id);
    loadCrews();
    const crew = crews.find((c) => c.id === crewId);
    if (crew) {
      toast({
        title: status === "available" ? "Экипаж активирован" : "Статус изменен",
        description: `${crew.unitName} ${status === "available" ? "теперь доступен" : "статус обновлен"}`,
      });
    }
  };

  const handlePanicToggle = (crewId: number, activate: boolean) => {
    if (!currentUser) return;
    
    const crew = crews.find((c) => c.id === crewId);
    if (!crew) return;
    
    if (activate) {
      activatePanic(crewId, currentUser.id);
      toast({
        title: '🚨 ТРЕВОГА АКТИВИРОВАНА',
        description: `Сигнал тревоги от экипажа ${crew.unitName}`,
        variant: 'destructive',
      });
    } else {
      resetPanic(crewId, currentUser.id);
      toast({
        title: 'Тревога сброшена',
        description: `Сигнал тревоги для экипажа ${crew.unitName} сброшен`,
      });
    }
    
    loadCrews();
  };

  const toggleMember = (userId: string) => {
    setCrewFormData((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  const allUsers = getAllUsers();
  const availableCount = crews.filter((c) => c.status === "available").length;
  const activeCount = crews.filter(
    (c) => c.status === "en-route" || c.status === "on-scene",
  ).length;
  const panicCount = crews.filter((c) => c.panicActive).length;
  const pendingCalls = calls.filter((c) => c.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Экипажи</h2>
          <p className="text-sm text-muted-foreground">
            Доступно сотрудников: {availableUsers.length}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Icon name="Plus" size={18} className="mr-2" />
          Создать экипаж
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего экипажей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{crews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Доступно
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {availableCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              На заданиях
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className={panicCount > 0 ? 'border-red-600 border-2 bg-red-50' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Icon name="AlertTriangle" size={16} className={panicCount > 0 ? 'text-red-600' : ''} />
              Сигналы тревоги
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${panicCount > 0 ? 'text-red-600' : ''}`}>
              {panicCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crews.map((crew) => (
          <CrewCard
            key={crew.id}
            crew={crew}
            allUsers={allUsers}
            currentUser={currentUser}
            onEdit={handleEdit}
            onManage={handleManage}
            onDelete={(crewId) => setDeleteDialog({ open: true, crewId })}
            onAssign={handleAssign}
            onStatusChange={handleStatusChange}
            onPanicToggle={handlePanicToggle}
          />
        ))}
      </div>

      <CrewDialogs
        editDialog={editDialog}
        createDialog={createDialog}
        manageDialog={manageDialog}
        deleteDialog={deleteDialog}
        assignDialog={assignDialog}
        formData={formData}
        crewFormData={crewFormData}
        selectedCallId={selectedCallId}
        availableUsers={availableUsers}
        pendingCalls={pendingCalls}
        onEditClose={() => setEditDialog({ open: false, crew: null })}
        onCreateClose={() => setCreateDialog(false)}
        onManageClose={() => setManageDialog({ open: false, crew: null })}
        onDeleteClose={() => setDeleteDialog({ open: false, crewId: null })}
        onAssignClose={() => setAssignDialog({ open: false, crew: null })}
        onFormDataChange={setFormData}
        onCrewFormDataChange={setCrewFormData}
        onSelectedCallChange={setSelectedCallId}
        onSaveStatus={handleSaveStatus}
        onSaveManage={handleSaveManage}
        onCreateCrew={handleCreateCrew}
        onDelete={handleDelete}
        onAssign={handleAssignToCall}
        onToggleMember={toggleMember}
      />
    </div>
  );
};

export default CrewsTab;