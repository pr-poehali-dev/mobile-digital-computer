import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { getTestById, getTestAssignmentById, getAllUsers, reviewTestManually, type TestAssignment } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface TestResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string | null;
  currentUser: User | null;
  canReview?: boolean;
}

const TestResultsDialog = ({ open, onOpenChange, assignmentId, currentUser, canReview = false }: TestResultsDialogProps) => {
  const [assignment, setAssignment] = useState<TestAssignment | null>(null);
  const [manualScore, setManualScore] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open && assignmentId) {
      const found = getTestAssignmentById(assignmentId);
      setAssignment(found);
      setManualScore(found?.score?.toString() || '');
    }
  }, [open, assignmentId]);

  if (!assignment) return null;

  const test = getTestById(assignment.testId);
  if (!test) return null;

  const assignedUser = getAllUsers().find(u => u.id === assignment.userId);
  const assignedByUser = getAllUsers().find(u => u.id === assignment.assignedBy);

  const handleReview = () => {
    if (!currentUser || !canReview) return;

    const score = parseFloat(manualScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный балл от 0 до 100',
        variant: 'destructive'
      });
      return;
    }

    reviewTestManually(assignment.id, score, currentUser.id);
    toast({
      title: 'Оценка выставлена',
      description: `Тест ${score >= test.passingScore ? 'пройден' : 'не пройден'}`
    });
    onOpenChange(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="FileText" size={20} />
            Результаты теста
          </DialogTitle>
          <DialogDescription>
            {test.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Сотрудник</p>
                  <p className="font-semibold">{assignedUser?.fullName || 'Неизвестно'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Статус</p>
                  <div>{getStatusBadge(assignment.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Назначил</p>
                  <p className="font-semibold">{assignedByUser?.fullName || 'Неизвестно'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата назначения</p>
                  <p className="font-semibold">{new Date(assignment.assignedAt).toLocaleString('ru-RU')}</p>
                </div>
                {assignment.startedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Начало</p>
                    <p className="font-semibold">{new Date(assignment.startedAt).toLocaleString('ru-RU')}</p>
                  </div>
                )}
                {assignment.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Завершение</p>
                    <p className="font-semibold">{new Date(assignment.completedAt).toLocaleString('ru-RU')}</p>
                  </div>
                )}
                {assignment.score !== undefined && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Результат</p>
                    <p className={`text-2xl font-bold ${assignment.score >= test.passingScore ? 'text-success' : 'text-destructive'}`}>
                      {assignment.score.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {assignment.answers && assignment.answers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ответы пользователя</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {test.questions.map((question, index) => {
                  const answer = assignment.answers?.find(a => a.questionId === question.id);
                  if (!answer) return null;

                  return (
                    <div key={question.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline">Вопрос {index + 1}</Badge>
                          <Badge variant="outline">{question.points} балл(ов)</Badge>
                          {answer.isCorrect !== undefined && (
                            answer.isCorrect ? 
                              <Badge className="bg-success text-white">Верно</Badge> : 
                              <Badge variant="destructive">Неверно</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{answer.timeSpent}с</p>
                      </div>

                      <p className="font-medium mb-2">{question.text}</p>

                      {question.type === 'text' ? (
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Ответ пользователя:</p>
                          <p className="whitespace-pre-wrap">{answer.textAnswer || 'Нет ответа'}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {question.options?.map((option, optIndex) => {
                            const isSelected = answer.selectedOptions?.includes(optIndex);
                            const isCorrect = question.correctAnswers?.includes(optIndex);
                            const showCorrectAnswers = test.showAnswers !== 'never' && (canReview || test.showAnswers === 'after-completion');
                            
                            let className = "p-2 rounded border ";
                            if (showCorrectAnswers) {
                              if (isSelected && isCorrect) {
                                className += "bg-success/10 border-success";
                              } else if (isSelected && !isCorrect) {
                                className += "bg-destructive/10 border-destructive";
                              } else if (!isSelected && isCorrect) {
                                className += "bg-warning/10 border-warning";
                              }
                            } else if (isSelected) {
                              className += "bg-primary/10 border-primary";
                            }

                            return (
                              <div key={optIndex} className={className}>
                                <div className="flex items-center gap-2">
                                  {showCorrectAnswers && isSelected && <Icon name="Check" size={16} className={isCorrect ? "text-success" : "text-destructive"} />}
                                  {showCorrectAnswers && !isSelected && isCorrect && <Icon name="ArrowRight" size={16} className="text-warning" />}
                                  {!showCorrectAnswers && isSelected && <Icon name="Check" size={16} className="text-primary" />}
                                  <span>{option}</span>
                                </div>
                              </div>
                            );
                          })}
                          {test.showAnswers === 'never' && !canReview && (
                            <p className="text-sm text-muted-foreground mt-2">Правильные ответы скрыты</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {canReview && assignment.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ручная проверка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manualScore">Итоговый балл (0-100)</Label>
                  <Input
                    id="manualScore"
                    type="number"
                    min="0"
                    max="100"
                    value={manualScore}
                    onChange={(e) => setManualScore(e.target.value)}
                    placeholder="Введите балл"
                  />
                  <p className="text-sm text-muted-foreground">
                    Проходной балл: {test.passingScore}%
                  </p>
                </div>

                <Button onClick={handleReview} className="w-full">
                  <Icon name="Check" size={16} className="mr-2" />
                  Выставить оценку
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestResultsDialog;