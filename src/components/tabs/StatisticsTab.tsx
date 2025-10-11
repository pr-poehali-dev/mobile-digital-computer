import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { getAllUsers, getShiftStatistics, getUserShiftStatistics, type ShiftStatistics } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';

interface StatisticsTabProps {
  currentUser: User;
  canViewAllStats: boolean;
}

const StatisticsTab = ({ currentUser, canViewAllStats }: StatisticsTabProps) => {
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statistics, setStatistics] = useState<ShiftStatistics | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const loadData = () => {
    if (canViewAllStats) {
      setAllUsers(getAllUsers());
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const stats = getShiftStatistics(selectedUserId, dateStr);
    setStatistics(stats);
  };

  useEffect(() => {
    loadData();
  }, [selectedUserId, selectedDate, canViewAllStats]);

  useSync(['shift_statistics_updated', 'users_updated'], () => {
    loadData();
  }, 1000);

  const formatTime = (ms: number): string => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}ч ${minutes}м`;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateDisplay = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const selectedUser = canViewAllStats 
    ? allUsers.find(u => u.id === selectedUserId)
    : currentUser;

  return (
    <div className="space-y-6">
      {canViewAllStats && (
        <Card>
          <CardHeader>
            <CardTitle>Выбор сотрудника</CardTitle>
            <CardDescription>Просмотр статистики рабочего времени</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} ({user.role === 'manager' ? 'Менеджер' : 
                                      user.role === 'director' ? 'Руководитель' : 
                                      user.role === 'dispatcher' ? 'Диспетчер' : 
                                      'Сотрудник'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Calendar" size={24} />
            Календарь
          </CardTitle>
          <CardDescription>Выберите дату для просмотра статистики</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeDate(-1)}
            >
              <Icon name="ChevronLeft" size={20} />
            </Button>

            <div className="flex-1 text-center">
              <p className="text-lg font-semibold">{formatDateDisplay(selectedDate)}</p>
              <p className="text-sm text-muted-foreground">
                {selectedDate.toISOString().split('T')[0]}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => changeDate(1)}
            >
              <Icon name="ChevronRight" size={20} />
            </Button>
          </div>

          {!isToday && (
            <Button
              variant="outline"
              className="w-full"
              onClick={goToToday}
            >
              <Icon name="CalendarDays" size={16} className="mr-2" />
              Сегодня
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="BarChart3" size={24} />
            Статистика за {selectedDate.toISOString().split('T')[0]}
          </CardTitle>
          <CardDescription>
            {selectedUser?.fullName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statistics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Clock" size={20} className="text-success" />
                    <p className="text-sm font-medium text-success">Время на смене</p>
                  </div>
                  <p className="text-3xl font-bold">{formatTime(statistics.totalWorkTime)}</p>
                </div>

                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Coffee" size={20} className="text-warning" />
                    <p className="text-sm font-medium text-warning">Время на перерыве</p>
                  </div>
                  <p className="text-3xl font-bold">{formatTime(statistics.totalBreakTime)}</p>
                </div>
              </div>

              {statistics.sessions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Сессии</h4>
                  {statistics.sessions.map((session, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {session.status === 'work' ? (
                            <Icon name="Briefcase" size={16} className="text-success" />
                          ) : (
                            <Icon name="Coffee" size={16} className="text-warning" />
                          )}
                          <span className="text-sm font-medium">
                            {session.status === 'work' ? 'Работа' : 'Перерыв'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm font-semibold">{formatTime(session.duration)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Icon name="Calendar" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Нет данных за выбранную дату
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedUser?.fullName} не работал в этот день
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsTab;
