import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { getAllTests, getAllTestAssignments, getTestStatistics, deleteTest, type Test } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';
import { useToast } from '@/hooks/use-toast';
import TestCreatorDialog from '@/components/TestCreatorDialog';
import TestAssignDialog from '@/components/TestAssignDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TestsTabProps {
  currentUser: User | null;
}

const TestsTab = ({ currentUser }: TestsTabProps) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; testId: string | null }>({ open: false, testId: null });
  const { toast } = useToast();

  const loadTests = () => {
    const allTests = getAllTests();
    setTests(allTests);
  };

  useEffect(() => {
    loadTests();
  }, []);

  useSync(['tests_updated'], loadTests, 5000);

  const handleDelete = (testId: string) => {
    deleteTest(testId);
    setDeleteDialog({ open: false, testId: null });
    toast({
      title: 'Тест удален',
      description: 'Тест и все связанные назначения были удалены'
    });
  };

  const handleAssign = (test: Test) => {
    setSelectedTest(test);
    setAssignOpen(true);
  };

  const myTests = tests.filter(t => t.createdBy === currentUser?.id);
  const displayTests = activeTab === 'my' ? myTests : tests;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Система тестирования</h2>
          <p className="text-muted-foreground mt-1">Создание и управление тестами для сотрудников</p>
        </div>
        <Button onClick={() => setCreatorOpen(true)}>
          <Icon name="Plus" size={16} className="mr-2" />
          Создать тест
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="FileText" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего тестов</p>
                <p className="text-2xl font-bold">{tests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Icon name="UserCheck" size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Мои тесты</p>
                <p className="text-2xl font-bold">{myTests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Icon name="Users" size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Назначений</p>
                <p className="text-2xl font-bold">{getAllTestAssignments().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'my')}>
        <TabsList>
          <TabsTrigger value="all">Все тесты</TabsTrigger>
          <TabsTrigger value="my">Мои тесты</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayTests.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Icon name="FileQuestion" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === 'my' ? 'Вы еще не создали ни одного теста' : 'Нет доступных тестов'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              displayTests.map(test => {
                const stats = getTestStatistics(test.id);
                return (
                  <Card key={test.id}>
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="line-clamp-2">{test.title}</span>
                        {test.requiresManualCheck && (
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            <Icon name="Eye" size={12} className="mr-1" />
                            Ручная проверка
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Вопросов</p>
                          <p className="font-semibold">{test.questions.length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Проходной балл</p>
                          <p className="font-semibold">{test.passingScore}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Назначено</p>
                          <p className="font-semibold">{stats.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Пройдено</p>
                          <p className="font-semibold text-success">{stats.passed}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleAssign(test)} 
                          size="sm" 
                          className="flex-1"
                        >
                          <Icon name="UserPlus" size={14} className="mr-1" />
                          Назначить
                        </Button>
                        {test.createdBy === currentUser?.id && (
                          <Button 
                            onClick={() => setDeleteDialog({ open: true, testId: test.id })} 
                            size="sm" 
                            variant="outline"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <TestCreatorDialog 
        open={creatorOpen} 
        onOpenChange={setCreatorOpen}
        currentUser={currentUser}
        onSuccess={loadTests}
      />

      <TestAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        test={selectedTest}
        currentUser={currentUser}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, testId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тест?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Тест и все связанные с ним назначения будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog.testId && handleDelete(deleteDialog.testId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestsTab;
