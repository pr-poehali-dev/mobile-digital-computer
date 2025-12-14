import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/auth';
import { createTest, type Question, type QuestionType } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface TestCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User | null;
  onSuccess?: () => void;
}

const TestCreatorDialog = ({ open, onOpenChange, currentUser, onSuccess }: TestCreatorDialogProps) => {
  const [step, setStep] = useState<'info' | 'questions'>('info');
  const [testInfo, setTestInfo] = useState({ title: '', description: '', passingScore: 70 });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'single',
    points: 1,
    options: ['', ''],
    correctAnswers: []
  });
  const { toast } = useToast();

  const handleAddQuestion = () => {
    if (!currentQuestion.text || currentQuestion.text.trim() === '') {
      toast({
        title: 'Ошибка',
        description: 'Введите текст вопроса',
        variant: 'destructive'
      });
      return;
    }

    if (currentQuestion.type !== 'text') {
      const validOptions = (currentQuestion.options || []).filter(o => o.trim() !== '');
      if (validOptions.length < 2) {
        toast({
          title: 'Ошибка',
          description: 'Добавьте минимум 2 варианта ответа',
          variant: 'destructive'
        });
        return;
      }

      if (!currentQuestion.correctAnswers || currentQuestion.correctAnswers.length === 0) {
        toast({
          title: 'Ошибка',
          description: 'Отметьте правильные ответы',
          variant: 'destructive'
        });
        return;
      }
    }

    const newQuestion: Question = {
      id: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: currentQuestion.text!,
      type: currentQuestion.type as QuestionType,
      points: currentQuestion.points || 1,
      timeLimit: currentQuestion.timeLimit,
      ...(currentQuestion.type !== 'text' && {
        options: (currentQuestion.options || []).filter(o => o.trim() !== ''),
        correctAnswers: currentQuestion.correctAnswers
      })
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'single',
      points: 1,
      options: ['', ''],
      correctAnswers: []
    });

    toast({
      title: 'Вопрос добавлен',
      description: `Вопрос #${questions.length + 1} успешно добавлен`
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateTest = () => {
    if (!currentUser) return;

    if (questions.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Добавьте хотя бы один вопрос',
        variant: 'destructive'
      });
      return;
    }

    const requiresManualCheck = questions.some(q => q.type === 'text');

    createTest({
      title: testInfo.title,
      description: testInfo.description,
      questions,
      passingScore: testInfo.passingScore,
      requiresManualCheck
    }, currentUser.id);

    toast({
      title: 'Тест создан',
      description: `Тест "${testInfo.title}" успешно создан`
    });

    handleClose();
    onSuccess?.();
  };

  const handleClose = () => {
    setStep('info');
    setTestInfo({ title: '', description: '', passingScore: 70 });
    setQuestions([]);
    setCurrentQuestion({
      type: 'single',
      points: 1,
      options: ['', ''],
      correctAnswers: []
    });
    onOpenChange(false);
  };

  const handleToggleCorrectAnswer = (index: number) => {
    const current = currentQuestion.correctAnswers || [];
    if (currentQuestion.type === 'single') {
      setCurrentQuestion({ ...currentQuestion, correctAnswers: [index] });
    } else {
      if (current.includes(index)) {
        setCurrentQuestion({ ...currentQuestion, correctAnswers: current.filter(i => i !== index) });
      } else {
        setCurrentQuestion({ ...currentQuestion, correctAnswers: [...current, index] });
      }
    }
  };

  const handleAddOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...(currentQuestion.options || []), '']
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="FileText" size={20} />
            {step === 'info' ? 'Создать тест' : 'Добавить вопросы'}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' ? 'Укажите информацию о тесте' : `Добавлено вопросов: ${questions.length}`}
          </DialogDescription>
        </DialogHeader>

        {step === 'info' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название теста *</Label>
              <Input
                id="title"
                placeholder="Например: Знание инструкций по безопасности"
                value={testInfo.title}
                onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Опишите цель и содержание теста"
                value={testInfo.description}
                onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Проходной балл (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={testInfo.passingScore}
                onChange={(e) => setTestInfo({ ...testInfo, passingScore: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {questions.length > 0 && (
              <div className="space-y-2">
                <Label>Добавленные вопросы ({questions.length})</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {questions.map((q, index) => (
                    <Card key={q.id}>
                      <CardContent className="p-3 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">#{index + 1}. {q.text}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {q.type === 'single' ? 'Одиночный' : q.type === 'multiple' ? 'Множественный' : 'Текстовый'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{q.points} балл(ов)</Badge>
                            {q.timeLimit && <Badge variant="outline" className="text-xs">{q.timeLimit}с</Badge>}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveQuestion(index)}>
                          <Icon name="X" size={14} />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Новый вопрос</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Тип вопроса</Label>
                    <Select 
                      value={currentQuestion.type} 
                      onValueChange={(v) => setCurrentQuestion({ 
                        ...currentQuestion, 
                        type: v as QuestionType,
                        options: v === 'text' ? undefined : ['', ''],
                        correctAnswers: []
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Одиночный выбор</SelectItem>
                        <SelectItem value="multiple">Множественный выбор</SelectItem>
                        <SelectItem value="text">Текстовый ответ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Баллы</Label>
                      <Input
                        type="number"
                        min="1"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Время (сек)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Без лимита"
                        value={currentQuestion.timeLimit || ''}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Текст вопроса *</Label>
                  <Textarea
                    placeholder="Введите вопрос"
                    value={currentQuestion.text || ''}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                    rows={2}
                  />
                </div>

                {currentQuestion.type !== 'text' && (
                  <div className="space-y-2">
                    <Label>Варианты ответов (отметьте правильные)</Label>
                    <div className="space-y-2">
                      {(currentQuestion.options || []).map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={(currentQuestion.correctAnswers || []).includes(index)}
                            onCheckedChange={() => handleToggleCorrectAnswer(index)}
                          />
                          <Input
                            placeholder={`Вариант ${index + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion({ ...currentQuestion, options: newOptions });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                      <Icon name="Plus" size={14} className="mr-1" />
                      Добавить вариант
                    </Button>
                  </div>
                )}

                <Button onClick={handleAddQuestion} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить вопрос
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          {step === 'info' ? (
            <Button 
              onClick={() => setStep('questions')} 
              disabled={!testInfo.title.trim()}
            >
              Далее: Добавить вопросы
              <Icon name="ArrowRight" size={16} className="ml-2" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('info')}>
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Назад
              </Button>
              <Button onClick={handleCreateTest} disabled={questions.length === 0}>
                <Icon name="Check" size={16} className="mr-2" />
                Создать тест
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestCreatorDialog;
