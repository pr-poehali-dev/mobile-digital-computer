import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { register } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface RegisterPageProps {
  onBackToLogin: () => void;
}

const RegisterPage = ({ onBackToLogin }: RegisterPageProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      return 'Заполните все поля';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Введите корректный email';
    }

    if (formData.password.length < 6) {
      return 'Пароль должен содержать минимум 6 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Пароли не совпадают';
    }

    const nameParts = formData.fullName.trim().split(' ');
    if (nameParts.length < 2) {
      return 'Введите имя и фамилию';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Ошибка валидации',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      });

      if (result.success) {
        toast({
          title: 'Регистрация успешна',
          description: 'Ваша заявка отправлена. Ожидайте активации аккаунта менеджером.'
        });
        
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } else {
        toast({
          title: 'Ошибка регистрации',
          description: result.error || 'Произошла ошибка при регистрации',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла непредвиденная ошибка',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Icon name="UserPlus" size={28} />
            Регистрация
          </CardTitle>
          <CardDescription className="text-center">
            Создайте аккаунт для доступа к системе MDC
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Имя и Фамилия</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Иванов Иван"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Электронная почта</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 6 символов"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Повторите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
              <Icon name="Info" size={16} className="inline mr-2" />
              После регистрации ваш аккаунт должен быть активирован менеджером или руководителем
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Регистрация...
                </>
              ) : (
                <>
                  <Icon name="UserPlus" size={16} className="mr-2" />
                  Зарегистрироваться
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBackToLogin}
              disabled={isLoading}
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Вернуться к входу
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
