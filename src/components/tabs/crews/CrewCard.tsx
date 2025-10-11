import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { type Crew, type User } from "@/lib/store";

interface CrewCardProps {
  crew: Crew;
  allUsers: User[];
  currentUser: User | null;
  onEdit: (crew: Crew) => void;
  onManage: (crew: Crew) => void;
  onDelete: (crewId: number) => void;
  onAssign: (crew: Crew) => void;
  onStatusChange: (crewId: number, status: Crew["status"]) => void;
  onPanicToggle: (crewId: number, activate: boolean) => void;
  onSignal100Reset?: () => void;
}

const getStatusConfig = (status: Crew["status"]) => {
  switch (status) {
    case "available":
      return {
        label: "Доступен",
        variant: "default" as const,
        bgColor: "bg-success/10",
        textColor: "text-success",
        icon: "CheckCircle2",
      };
    case "en-route":
      return {
        label: "В пути",
        variant: "default" as const,
        bgColor: "bg-primary/10",
        textColor: "text-primary",
        icon: "Navigation",
      };
    case "on-scene":
      return {
        label: "На месте",
        variant: "default" as const,
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        icon: "AlertCircle",
      };
    case "unavailable":
      return {
        label: "Недоступен",
        variant: "secondary" as const,
        bgColor: "bg-muted",
        textColor: "text-muted-foreground",
        icon: "XCircle",
      };
  }
};

const CrewCard = ({
  crew,
  allUsers,
  currentUser,
  onEdit,
  onManage,
  onDelete,
  onAssign,
  onStatusChange,
  onPanicToggle,
  onSignal100Reset,
}: CrewCardProps) => {
  const statusConfig = getStatusConfig(crew.status);
  const lastUpdate = new Date(crew.lastUpdate).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const crewMembers = allUsers.filter((u) => crew.members.includes(u.id));

  return (
    <Card className={`hover:shadow-lg transition-shadow ${crew.panicActive ? 'border-red-600 border-2' : crew.signal100Active ? 'border-yellow-500 border-2' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {crew.unitName}
              {crew.panicActive && (
                <Badge variant="destructive" className="animate-pulse">
                  🚨 ТРЕВОГА
                </Badge>
              )}
              {crew.signal100Active && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse">
                  🟡 СИГНАЛ 100
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Обновлено: {lastUpdate}
            </p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onManage(crew)}>
              <Icon name="Edit" size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(crew.id)}
            >
              <Icon name="Trash2" size={18} className="text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`flex items-center space-x-2 p-3 rounded-lg ${statusConfig.bgColor}`}
        >
          <Icon
            name={statusConfig.icon}
            size={20}
            className={statusConfig.textColor}
          />
          <span className={`font-medium ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>

        {crew.location && (
          <div className="flex items-start space-x-2 text-sm">
            <Icon
              name="MapPin"
              size={16}
              className="text-muted-foreground mt-0.5"
            />
            <span className="text-muted-foreground">{crew.location}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Icon name="Users" size={16} className="text-muted-foreground" />
            <span>Состав ({crew.members.length}):</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {crewMembers.map((member) => (
              <Badge key={member.id} variant="outline" className="text-xs">
                {member.fullName}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              onClick={() => onEdit(crew)}
            >
              <Icon name="Settings" size={16} className="mr-1" />
              Статус
            </Button>
            {crew.status === "available" && (
              <Button
                variant="default"
                className="flex-1"
                size="sm"
                onClick={() => onAssign(crew)}
              >
                <Icon name="Send" size={16} className="mr-1" />
                Назначить
              </Button>
            )}
            {crew.status === "unavailable" && (
              <Button
                variant="outline"
                className="flex-1"
                size="sm"
                onClick={() => onStatusChange(crew.id, "available")}
              >
                <Icon name="CheckCircle2" size={16} className="mr-1" />
                Активировать
              </Button>
            )}
            {(crew.status === "en-route" || crew.status === "on-scene") && (
              <Button
                variant="outline"
                className="flex-1"
                size="sm"
                onClick={() => onStatusChange(crew.id, "available")}
              >
                <Icon name="Home" size={16} className="mr-1" />
                Освободить
              </Button>
            )}
          </div>
          
          {crew.status !== "unavailable" && (
            <>
              <Button
                onClick={() => onPanicToggle(crew.id, !crew.panicActive)}
                disabled={false}
                variant={crew.panicActive ? "destructive" : "default"}
                size="sm"
                className={`w-full gap-2 font-bold ${
                  crew.panicActive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Icon name="AlertTriangle" size={18} />
                {crew.panicActive ? 'СБРОСИТЬ ТРЕВОГУ' : 'КНОПКА ПАНИКИ'}
              </Button>
              {crew.signal100Active && onSignal100Reset && (
                <Button
                  onClick={onSignal100Reset}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                >
                  <Icon name="RadioOff" size={18} />
                  ОТМЕНИТЬ СИГНАЛ 100
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CrewCard;