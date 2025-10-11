import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

const AnalyticsTab = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon name="Phone" size={16} className="mr-2" />
              Вызовов за сегодня
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">247</div>
            <p className="text-xs text-success mt-1">+12% от вчера</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon name="Clock" size={16} className="mr-2" />
              Среднее время отклика
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4:32</div>
            <p className="text-xs text-success mt-1">-8% от среднего</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon name="CheckCircle2" size={16} className="mr-2" />
              Завершенных вызовов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">235</div>
            <p className="text-xs text-muted-foreground mt-1">95.1% успешно</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon name="Users" size={16} className="mr-2" />
              Активных экипажей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4/6</div>
            <p className="text-xs text-muted-foreground mt-1">66.7% занятость</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Типы вызовов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Медицинская помощь</span>
                <span className="font-medium">42%</span>
              </div>
              <Progress value={42} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ДТП</span>
                <span className="font-medium">28%</span>
              </div>
              <Progress value={28} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Пожар</span>
                <span className="font-medium">18%</span>
              </div>
              <Progress value={18} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Другое</span>
                <span className="font-medium">12%</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Эффективность экипажей</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { unit: 'NU-10', calls: 45, time: '3:45', rating: 98 },
              { unit: 'NU-12', calls: 42, time: '4:12', rating: 95 },
              { unit: 'NU-15', calls: 38, time: '4:56', rating: 92 },
              { unit: 'NU-07', calls: 41, time: '4:02', rating: 94 },
            ].map((crew) => (
              <div key={crew.unit} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{crew.unit}</span>
                  <span className="text-sm text-success font-medium">{crew.rating}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Вызовов: {crew.calls}</div>
                  <div>Ср. время: {crew.time}</div>
                </div>
                <Progress value={crew.rating} className="h-2 mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Активность по часам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-48 gap-2">
            {[12, 8, 15, 22, 18, 25, 30, 28, 24, 20, 26, 22, 18, 15, 12, 10, 8, 12, 16, 20, 24, 26, 22, 18].map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                  style={{ height: `${(value / 30) * 100}%` }}
                />
                {idx % 4 === 0 && (
                  <span className="text-xs text-muted-foreground">{idx}:00</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
