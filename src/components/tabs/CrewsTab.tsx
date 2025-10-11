import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { getCrews, updateCrewStatus, type Crew } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

const getStatusConfig = (status: Crew['status']) => {
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
  const [crews, setCrews] = useState<Crew[]>([]);
  const [editDialog, setEditDialog] = useState<{ open: boolean; crew: Crew | null }>({ open: false, crew: null });
  const [formData, setFormData] = useState({
    status: 'available' as Crew['status'],
    location: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCrews();
  }, []);

  const loadCrews = () => {
    setCrews(getCrews());
  };

  const handleEdit = (crew: Crew) => {
    setFormData({
      status: crew.status,
      location: crew.location || ''
    });
    setEditDialog({ open: true, crew });
  };

  const handleSave = () => {
    if (editDialog.crew) {
      updateCrewStatus(editDialog.crew.id, formData.status, formData.location);
      loadCrews();
      setEditDialog({ open: false, crew: null });
      toast({
        title: 'Статус обновлен',
        description: `Экипаж ${editDialog.crew.unitName} успешно обновлен`,
      });
    }
  };

  const availableCount = crews.filter(c => c.status === 'available').length;
  const activeCount = crews.filter(c => c.status === 'en-route' || c.status === 'on-scene').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего экипажей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{crews.length}</div>
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
        {crews.map((crew) => {
          const statusConfig = getStatusConfig(crew.status);
          const lastUpdate = new Date(crew.lastUpdate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          
          return (
            <Card key={crew.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{crew.unitName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Обновлено: {lastUpdate}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(crew)}>
                    <Icon name="Settings" size={18} />
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

                <div className="flex gap-2">
                  {crew.status === 'available' && (
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => handleEdit(crew)}
                    >
                      <Icon name="UserPlus" size={16} className="mr-1" />
                      Назначить
                    </Button>
                  )}
                  {crew.status === 'unavailable' && (
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        setFormData({ status: 'available', location: crew.location || '' });
                        setEditDialog({ open: true, crew });
                      }}
                    >
                      <Icon name="CheckCircle2" size={16} className="mr-1" />
                      Активировать
                    </Button>
                  )}
                  {(crew.status === 'en-route' || crew.status === 'on-scene') && (
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        updateCrewStatus(crew.id, 'available');
                        loadCrews();
                        toast({ title: 'Экипаж освобожден', description: `${crew.unitName} теперь доступен` });
                      }}
                    >
                      <Icon name="Home" size={16} className="mr-1" />
                      Освободить
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, crew: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Управление экипажем {editDialog.crew?.unitName}</DialogTitle>
            <DialogDescription>
              Измените статус и местоположение экипажа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={formData.status} onValueChange={(value: Crew['status']) => setFormData({ ...formData, status: value })}>
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
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Станция №1, ул. Ленина, 45..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, crew: null })}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrewsTab;