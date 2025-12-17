import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { getUserTestAssignments, getTestById, type TestAssignment } from '@/lib/store';
import { useSync } from '@/hooks/use-sync';
import TestTakingView from './TestTakingView';
import TestResultsDialog from './TestResultsDialog';

interface MyTestsViewProps {
  currentUser: User | null;
}

const MyTestsView = ({ currentUser }: MyTestsViewProps) => {
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<TestAssignment | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  const loadAssignments = () => {
    if (!currentUser) return;
    setAssignments(getUserTestAssignments(currentUser.id));
  };

  useEffect(() => {
    loadAssignments();
  }, [currentUser]);

  useSync(['test_assignments_updated'], loadAssignments, 5000);

  if (activeAssignment) {
    return (
      <TestTakingView
        assignment={activeAssignment}
        onComplete={() => {
          setActiveAssignment(null);
          loadAssignments();
        }}
        onCancel={() => setActiveAssignment(null)}
      />
    );
  }

  const pending = assignments.filter(a => a.status === 'pending');
  const inProgress = assignments.filter(a => a.status === 'in-progress');
  const completed = assignments.filter(a => a.status === 'completed' || a.status === 'passed' || a.status === 'failed');

  const getStatusBadge = (status: TestAssignment['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ожидает</Badge>;
      case 'in-progress':
        return <Badge variant="default">Выполняется</Badge>;
      case 'completed':
        return <Badge variant="outline">На проверке</Badge>;
      case 'passed':
        return <Badge className="bg-success text-white">Пройден</Badge>;
      case 'failed':
        return <Badge variant="destructive">Не пройден</Badge>;
    }
  };

  const renderAssignment = (assignment: TestAssignment) => {
    const test = getTestById(assignment.testId);
    if (!test) return null;

    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

    return (
      <Card key={assignment.id} className={isOverdue && assignment.status === 'pending' ? 'border-destructive' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{test.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
            </div>
            {getStatusBadge(assignment.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Вопросов</p>
              <p className="font-semibold">{test.questions.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Проходной балл</p>
              <p className="font-semibold">{test.passingScoreType === 'percentage' ? `${test.passingScore}%` : `${test.passingScore} баллов`}</p>
            </div>
            {assignment.dueDate && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Срок</p>
                <p className={`font-semibold ${isOverdue ? 'text-destructive' : ''}`}>
                  {new Date(assignment.dueDate).toLocaleString('ru-RU')}
                </p>
              </div>
            )}
            {assignment.score !== undefined && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Результат</p>
                <p className="font-semibold text-lg">{assignment.score.toFixed(1)}%</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {(assignment.status === 'pending' || assignment.status === 'in-progress') && (
              <Button onClick={() => setActiveAssignment(assignment)} className="flex-1">
                <Icon name="Play" size={16} className="mr-2" />
                {assignment.status === 'in-progress' ? 'Продолжить' : 'Начать тест'}
              </Button>
            )}
            {(assignment.status === 'completed' || assignment.status === 'passed' || assignment.status === 'failed') && (
              <Button 
                onClick={() => {
                  setSelectedAssignmentId(assignment.id);
                  setResultsOpen(true);
                }} 
                variant="outline"
                className="flex-1"
              >
                <Icon name="Eye" size={16} className="mr-2" />
                Посмотреть результаты
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Мои тесты</h2>
        <p className="text-muted-foreground mt-1">Назначенные вам тесты для прохождения</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Icon name="Clock" size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ожидают</p>
                <p className="text-2xl font-bold">{pending.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Play" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">В процессе</p>
                <p className="text-2xl font-bold">{inProgress.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Icon name="CheckCircle" size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Завершено</p>
                <p className="text-2xl font-bold">{completed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Ожидают ({pending.length})</TabsTrigger>
          <TabsTrigger value="in-progress">В процессе ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="completed">Завершено ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Icon name="CheckCircle" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Нет ожидающих тестов</p>
                </CardContent>
              </Card>
            ) : (
              pending.map(renderAssignment)
            )}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgress.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Icon name="Play" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Нет тестов в процессе</p>
                </CardContent>
              </Card>
            ) : (
              inProgress.map(renderAssignment)
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Нет завершенных тестов</p>
                </CardContent>
              </Card>
            ) : (
              completed.map(renderAssignment)
            )}
          </div>
        </TabsContent>
      </Tabs>

      <TestResultsDialog
        open={resultsOpen}
        onOpenChange={setResultsOpen}
        assignmentId={selectedAssignmentId}
        currentUser={currentUser}
        canReview={false}
      />
    </div>
  );
};

export default MyTestsView;