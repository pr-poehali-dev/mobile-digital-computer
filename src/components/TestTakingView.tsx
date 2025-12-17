import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { getTestById, startTestAttempt, submitTestAnswers, type TestAssignment, type TestAnswer, type Question } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TestTakingViewProps {
  assignment: TestAssignment;
  onComplete: () => void;
  onCancel: () => void;
}

const TestTakingView = ({ assignment, onComplete, onCancel }: TestTakingViewProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<TestAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const test = getTestById(assignment.testId);

  // Применяем рандомизацию к вопросам и вариантам при старте
  useEffect(() => {
    if (!test || !started) return;

    let questions = [...test.questions];

    // Фильтруем вопросы по банку (если есть)
    if (assignment.selectedQuestionIds) {
      questions = questions.filter(q => assignment.selectedQuestionIds!.includes(q.id));
    }

    // Применяем порядок вопросов
    if (assignment.questionOrder) {
      const orderMap = new Map(questions.map(q => [q.id, q]));
      questions = assignment.questionOrder.map(id => orderMap.get(id)!).filter(Boolean);
    }

    // Применяем рандомизацию вариантов ответов
    if (assignment.optionsOrder) {
      questions = questions.map(q => {
        if (q.type === 'text' || !q.options || !assignment.optionsOrder![q.id]) {
          return q;
        }
        
        const order = assignment.optionsOrder![q.id];
        const newOptions = order.map(i => q.options![i]);
        
        return { ...q, options: newOptions };
      });
    }

    setOrderedQuestions(questions);
  }, [test, started, assignment]);

  useEffect(() => {
    // Усиленная защита от копирования
    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '');
      }
      toast({
        title: 'Копирование запрещено',
        description: 'Копирование содержимого теста не разрешено',
        variant: 'destructive'
      });
      return false;
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventKeyboardCopy = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X') {
          toast({
            title: 'Копирование запрещено',
            description: 'Копирование содержимого теста не разрешено',
            variant: 'destructive'
          });
        }
        return false;
      }
    };

    const preventDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const container = containerRef.current;
    if (container) {
      // События на контейнере
      container.addEventListener('copy', preventCopy as EventListener);
      container.addEventListener('cut', preventCopy as EventListener);
      container.addEventListener('contextmenu', preventContextMenu as EventListener);
      container.addEventListener('dragstart', preventDragStart as EventListener);
      container.addEventListener('selectstart', preventContextMenu as EventListener);
      
      // Глобальные события клавиатуры
      document.addEventListener('keydown', preventKeyboardCopy as EventListener);
      document.addEventListener('copy', preventCopy as EventListener);
      document.addEventListener('cut', preventCopy as EventListener);

      // CSS стили
      container.style.userSelect = 'none';
      container.style.webkitUserSelect = 'none';
      container.style.webkitTouchCallout = 'none';
      container.style.msUserSelect = 'none';
      container.style.mozUserSelect = 'none';

      return () => {
        container.removeEventListener('copy', preventCopy as EventListener);
        container.removeEventListener('cut', preventCopy as EventListener);
        container.removeEventListener('contextmenu', preventContextMenu as EventListener);
        container.removeEventListener('dragstart', preventDragStart as EventListener);
        container.removeEventListener('selectstart', preventContextMenu as EventListener);
        
        document.removeEventListener('keydown', preventKeyboardCopy as EventListener);
        document.removeEventListener('copy', preventCopy as EventListener);
        document.removeEventListener('cut', preventCopy as EventListener);
        
        container.style.userSelect = '';
        container.style.webkitUserSelect = '';
        container.style.webkitTouchCallout = '';
        container.style.msUserSelect = '';
        container.style.mozUserSelect = '';
      };
    }
  }, [toast]);

  useEffect(() => {
    if (!started || !test || orderedQuestions.length === 0) return;

    const currentQuestion = orderedQuestions[currentQuestionIndex];
    if (currentQuestion?.timeLimit) {
      setTimeLeft(currentQuestion.timeLimit);

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleNext();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentQuestionIndex, started, test, orderedQuestions]);

  if (!test) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Тест не найден</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = started && orderedQuestions.length > 0 
    ? orderedQuestions[currentQuestionIndex] 
    : test?.questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.find(a => a.questionId === currentQuestion.id) : undefined;

  const handleStart = () => {
    startTestAttempt(assignment.id);
    setStarted(true);
    setQuestionStartTime(Date.now());
  };

  const handleAnswer = (value: any) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newAnswer: TestAnswer = {
      questionId: currentQuestion.id,
      timeSpent,
      ...(currentQuestion.type === 'text' ? { textAnswer: value } : { selectedOptions: value })
    };

    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== currentQuestion.id);
      return [...filtered, newAnswer];
    });
  };

  const handleNext = () => {
    const questions = started ? orderedQuestions : test?.questions || [];
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
      setTimeLeft(questions[currentQuestionIndex + 1]?.timeLimit || null);
    } else {
      setSubmitDialog(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const questions = started ? orderedQuestions : test?.questions || [];
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
      setTimeLeft(questions[currentQuestionIndex - 1]?.timeLimit || null);
    }
  };

  const handleSubmit = () => {
    submitTestAnswers(assignment.id, answers);
    toast({
      title: 'Тест отправлен',
      description: 'Ваши ответы сохранены и отправлены на проверку'
    });
    onComplete();
  };

  if (!started) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{test.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{test.description}</p>
          
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Вопросов</p>
              <p className="text-lg font-semibold">{test.questions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Проходной балл</p>
              <p className="text-lg font-semibold">{test.passingScoreType === 'percentage' ? `${test.passingScore}%` : `${test.passingScore} баллов`}</p>
            </div>
          </div>

          <div className="bg-warning/10 p-4 rounded-lg space-y-2">
            <p className="font-medium flex items-center gap-2">
              <Icon name="AlertTriangle" size={16} className="text-warning" />
              Важно:
            </p>
            <ul className="text-sm space-y-1 ml-6 list-disc">
              <li>Копирование вопросов и ответов запрещено</li>
              <li>После начала теста нельзя вернуться к экрану выбора</li>
              <li>Некоторые вопросы могут иметь ограничение по времени</li>
              <li>Отвечайте внимательно - изменить ответы после отправки невозможно</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleStart} className="flex-1">
              <Icon name="Play" size={16} className="mr-2" />
              Начать тест
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalQuestions = started && orderedQuestions.length > 0 ? orderedQuestions.length : test?.questions.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const answeredCount = answers.length;

  return (
    <div ref={containerRef} className="select-none">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg select-none">
              Вопрос {currentQuestionIndex + 1} из {totalQuestions}
            </CardTitle>
            {timeLeft !== null && (
              <Badge variant={timeLeft < 10 ? 'destructive' : 'secondary'} className="text-lg px-3 select-none">
                <Icon name="Clock" size={14} className="mr-1" />
                {timeLeft}с
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2 items-start">
              <Badge variant="outline" className="select-none">{currentQuestion.points} балл(ов)</Badge>
              <Badge variant="outline" className="select-none">
                {currentQuestion.type === 'single' ? 'Одиночный выбор' : 
                 currentQuestion.type === 'multiple' ? 'Множественный выбор' : 
                 'Текстовый ответ'}
              </Badge>
            </div>

            <p className="text-lg font-medium">{currentQuestion.text}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.type === 'single' && (
              <RadioGroup
                value={currentAnswer?.selectedOptions?.[0]?.toString() || ''}
                onValueChange={(v) => handleAnswer([parseInt(v)])}
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'multiple' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`option-${index}`}
                      checked={currentAnswer?.selectedOptions?.includes(index) || false}
                      onCheckedChange={(checked) => {
                        const current = currentAnswer?.selectedOptions || [];
                        const updated = checked
                          ? [...current, index]
                          : current.filter(i => i !== index);
                        handleAnswer(updated);
                      }}
                    />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <Textarea
                placeholder="Введите ваш ответ..."
                value={currentAnswer?.textAnswer || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                rows={6}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <Icon name="ChevronLeft" size={16} className="mr-2" />
              Назад
            </Button>

            <p className="text-sm text-muted-foreground">
              Отвечено: {answeredCount} / {totalQuestions}
            </p>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button onClick={handleNext}>
                Далее
                <Icon name="ChevronRight" size={16} className="ml-2" />
              </Button>
            ) : (
              <Button onClick={() => setSubmitDialog(true)}>
                Завершить тест
                <Icon name="Check" size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={submitDialog} onOpenChange={setSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить тест?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы ответили на {answeredCount} из {totalQuestions} вопросов.
              После отправки изменить ответы будет невозможно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Продолжить тест</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Отправить ответы
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestTakingView;