import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type CrewStatus = 'available' | 'en-route' | 'on-scene' | 'unavailable';

interface Crew {
  id: string;
  unit: string;
  status: CrewStatus;
  location?: string;
  lastUpdate: string;
}

const mockCrews: Crew[] = [
  { id: '1', unit: 'NU-10', status: 'available', location: 'Станция №3', lastUpdate: '13:45' },
  { id: '2', unit: 'NU-12', status: 'en-route', location: 'ул. Ленина, 45', lastUpdate: '13:48' },
  { id: '3', unit: 'NU-15', status: 'on-scene', location: 'пр. Мира, 120', lastUpdate: '13:30' },
  { id: '4', unit: 'NU-07', status: 'available', location: 'Станция №1', lastUpdate: '13:50' },
  { id: '5', unit: 'NU-22', status: 'unavailable', location: 'Техобслуживание', lastUpdate: '12:00' },
  { id: '6', unit: 'NU-18', status: 'en-route', location: 'ул. Гагарина, 78', lastUpdate: '13:42' },
];

const getStatusConfig = (status: CrewStatus) => {
  switch (status) {
    case 'available':
      return { label: 'Доступен', variant: 'default' as const, bgColor: 'bg-success/10', textColor: 'text-success', icon: 'CheckCircle2' };
    case 'en-route':
      return { label: 'В пути', variant: 'default' as const, bgColor: 'bg-primary/10', textColor: 'text-primary', icon: 'Navigation' };
    case 'on-scene':
      return { label: 'На месте', variant: 'default' as const, bgColor: 'bg-warning/10', textColor: 'text-warning', icon: 'AlertCircle' };
    case 'unavailable':
      return { label: 'Недоступен', variant: 'secondary' as const, bgColor: 'bg-muted', textColor: 'text-muted-foreground', icon: 'XCircle' };
  }
};

const CrewsTab = () => {
  const availableCount = mockCrews.filter(c => c.status === 'available').length;
  const activeCount = mockCrews.filter(c => c.status === 'en-route' || c.status === 'on-scene').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего экипажей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockCrews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Доступно</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{availableCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">На заданиях</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCrews.map((crew) => {
          const statusConfig = getStatusConfig(crew.status);
          return (
            <Card key={crew.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{crew.unit}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Обновлено: {crew.lastUpdate}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Icon name="MoreVertical" size={18} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${statusConfig.bgColor}`}>
                  <Icon name={statusConfig.icon} size={20} className={statusConfig.textColor} />
                  <span className={`font-medium ${statusConfig.textColor}`}>{statusConfig.label}</span>
                </div>
                
                {crew.location && (
                  <div className="flex items-start space-x-2 text-sm">
                    <Icon name="MapPin" size={16} className="text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{crew.location}</span>
                  </div>
                )}

                <Button variant="outline" className="w-full" size="sm">
                  <Icon name="Eye" size={16} className="mr-2" />
                  Подробнее
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CrewsTab;
