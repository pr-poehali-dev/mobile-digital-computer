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
import { createTest, updateTest, updateTestQuestion, deleteTestQuestion, type Question, type QuestionType, type Test, type ShowAnswersMode } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface TestCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User | null;
  editTest?: Test | null;
  onSuccess?: () => void;
}

const TestCreatorDialog = ({ open, onOpenChange, currentUser, editTest, onSuccess }: TestCreatorDialogProps) => {
  const [step, setStep] = useState<'info' | 'questions'>('info');
  const [testInfo, setTestInfo] = useState({ 
    title: '', 
    description: '', 
    passingScore: 70,
    passingScoreType: 'percentage' as ('percentage' | 'points'),
    showAnswers: 'after-completion' as ShowAnswersMode,
    randomizeQuestions: false,
    randomizeOptions: false,
    questionBankSize: undefined as number | undefined
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'single',
    points: 1,
    options: ['', ''],
    correctAnswers: []
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open && editTest) {
      setTestInfo({
        title: editTest.title,
        description: editTest.description,
        passingScore: editTest.passingScore,
        passingScoreType: editTest.passingScoreType || 'percentage',
        showAnswers: editTest.showAnswers || 'after-completion',
        randomizeQuestions: editTest.randomizeQuestions || false,
        randomizeOptions: editTest.randomizeOptions || false,
        questionBankSize: editTest.questionBankSize
      });
      setQuestions(editTest.questions);
      setStep('info');
    }
  }, [open, editTest]);

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
    }

    if (editingQuestionId) {
      if (editTest) {
        const updates: Partial<Question> = {
          text: currentQuestion.text!,
          type: currentQuestion.type as QuestionType,
          points: currentQuestion.points || 1,
          timeLimit: currentQuestion.timeLimit,
          ...(currentQuestion.type !== 'text' && {
            options: (currentQuestion.options || []).filter(o => o.trim() !== ''),
            correctAnswers: currentQuestion.correctAnswers
          })
        };
        updateTestQuestion(editTest.id, editingQuestionId, updates);
      }
      setQuestions(questions.map(q => q.id === editingQuestionId ? {
        ...q,
        text: currentQuestion.text!,
        type: currentQuestion.type as QuestionType,
        points: currentQuestion.points || 1,
        timeLimit: currentQuestion.timeLimit,
        ...(currentQuestion.type !== 'text' && {
          options: (currentQuestion.options || []).filter(o => o.trim() !== ''),
          correctAnswers: currentQuestion.correctAnswers
        })
      } : q));
      setEditingQuestionId(null);
      toast({
        title: 'Вопрос обновлен',
        description: 'Изменения успешно сохранены'
      });
    } else {
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
      toast({
        title: 'Вопрос добавлен',
        description: `Вопрос #${questions.length + 1} успешно добавлен`
      });
    }

    setCurrentQuestion({
      type: 'single',
      points: 1,
      options: ['', ''],
      correctAnswers: []
    });
  };

  const handleRemoveQuestion = (questionId: string) => {
    if (editTest) {
      deleteTestQuestion(editTest.id, questionId);
    }
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion({
      text: question.text,
      type: question.type,
      points: question.points,
      timeLimit: question.timeLimit,
      options: question.options || ['', ''],
      correctAnswers: question.correctAnswers || []
    });
    setEditingQuestionId(question.id);
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setCurrentQuestion({
      type: 'single',
      points: 1,
      options: ['', ''],
      correctAnswers: []
    });
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

    const requiresManualCheck = questions.some(q => 
      q.type === 'text' || 
      (q.type !== 'text' && (!q.correctAnswers || q.correctAnswers.length === 0))
    );

    if (editTest) {
      updateTest(editTest.id, {
        title: testInfo.title,
        description: testInfo.description,
        questions,
        passingScore: testInfo.passingScore,
        passingScoreType: testInfo.passingScoreType,
        showAnswers: testInfo.showAnswers,
        requiresManualCheck,
        randomizeQuestions: testInfo.randomizeQuestions,
        randomizeOptions: testInfo.randomizeOptions,
        questionBankSize: testInfo.questionBankSize
      });

      toast({
        title: 'Тест обновлен',
        description: `Тест "${testInfo.title}" успешно обновлен`
      });
    } else {
      createTest({
        title: testInfo.title,
        description: testInfo.description,
        questions,
        passingScore: testInfo.passingScore,
        passingScoreType: testInfo.passingScoreType,
        showAnswers: testInfo.showAnswers,
        requiresManualCheck,
        randomizeQuestions: testInfo.randomizeQuestions,
        randomizeOptions: testInfo.randomizeOptions,
        questionBankSize: testInfo.questionBankSize
      }, currentUser.id);

      toast({
        title: 'Тест создан',
        description: `Тест "${testInfo.title}" успешно создан`
      });
    }

    handleClose();
    onSuccess?.();
  };

  const handleClose = () => {
    setStep('info');
    setTestInfo({ 
      title: '', 
      description: '', 
      passingScore: 70,
      passingScoreType: 'percentage' as ('percentage' | 'points'),
      showAnswers: 'after-completion',
      randomizeQuestions: false,
      randomizeOptions: false,
      questionBankSize: undefined
    });
    setQuestions([]);
    setEditingQuestionId(null);
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
            {editTest ? (step === 'info' ? 'Редактировать тест' : 'Редактировать вопросы') : (step === 'info' ? 'Создать тест' : 'Добавить вопросы')}
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
              <Label htmlFor="passingScoreType">Тип проходного балла</Label>
              <Select 
                value={testInfo.passingScoreType} 
                onValueChange={(v) => setTestInfo({ ...testInfo, passingScoreType: v as ('percentage' | 'points') })}
              >
                <SelectTrigger id="passingScoreType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Процент (%)</SelectItem>
                  <SelectItem value="points">Количество баллов</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">
                {testInfo.passingScoreType === 'percentage' ? 'Проходной балл (%)' : 'Проходной балл (баллы)'}
              </Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max={testInfo.passingScoreType === 'percentage' ? 100 : undefined}
                step={testInfo.passingScoreType === 'points' ? '0.1' : '1'}
                value={testInfo.passingScore}
                onChange={(e) => setTestInfo({ ...testInfo, passingScore: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                {testInfo.passingScoreType === 'percentage' 
                  ? 'Процент правильных ответов для прохождения теста (0-100)'
                  : 'Минимальное количество баллов для прохождения теста'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="showAnswers">Показ правильных ответов</Label>
              <Select 
                value={testInfo.showAnswers} 
                onValueChange={(v) => setTestInfo({ ...testInfo, showAnswers: v as ShowAnswersMode })}
              >
                <SelectTrigger id="showAnswers">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Сразу после ответа</SelectItem>
                  <SelectItem value="after-completion">После прохождения теста</SelectItem>
                  <SelectItem value="never">Не показывать</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Icon name="Shuffle" size={16} />
                Настройки рандомизации
              </h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="randomizeQuestions"
                  checked={testInfo.randomizeQuestions}
                  onCheckedChange={(checked) => setTestInfo({ ...testInfo, randomizeQuestions: !!checked })}
                />
                <Label htmlFor="randomizeQuestions" className="cursor-pointer">
                  Перемешивать порядок вопросов для каждого студента
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="randomizeOptions"
                  checked={testInfo.randomizeOptions}
                  onCheckedChange={(checked) => setTestInfo({ ...testInfo, randomizeOptions: !!checked })}
                />
                <Label htmlFor="randomizeOptions" className="cursor-pointer">
                  Перемешивать порядок вариантов ответов
                </Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="questionBankSize">Банк вопросов (опционально)</Label>
                  <Badge variant="outline" className="text-xs">PRO</Badge>
                </div>
                <Input
                  id="questionBankSize"
                  type="number"
                  min="0"
                  placeholder="Оставьте пустым или укажите количество"
                  value={testInfo.questionBankSize || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setTestInfo({ ...testInfo, questionBankSize: val });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Если указано, каждый студент получит N случайных вопросов из всех добавленных
                </p>
              </div>
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
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditQuestion(q)}>
                            <Icon name="Pencil" size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveQuestion(q.id)}>
                            <Icon name="X" size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{editingQuestionId ? 'Редактировать вопрос' : 'Новый вопрос'}</CardTitle>
                  {editingQuestionId && (
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <Icon name="X" size={14} className="mr-1" />
                      Отмена
                    </Button>
                  )}
                </div>
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
                        min="0"
                        step="0.1"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Можно указать дробное число (например, 0.5, 1.5)
                      </p>
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
                  <Icon name={editingQuestionId ? "Check" : "Plus"} size={16} className="mr-2" />
                  {editingQuestionId ? 'Сохранить изменения' : 'Добавить вопрос'}
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
                {editTest ? 'Сохранить изменения' : 'Создать тест'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestCreatorDialog;