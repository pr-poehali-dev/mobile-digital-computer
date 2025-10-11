import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { authenticate, saveUserSession, type User } from '@/lib/auth';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authenticate(userId, password);
      
      if (result.success && result.user) {
        saveUserSession(result.user);
        onLogin(result.user);
      } else {
        setError(result.error || 'Ошибка авторизации');
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-destructive/5" />
      
      <Card className="w-full max-w-md mx-4 relative z-10 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Radio" size={32} className="text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Mobile Digital Computer</CardTitle>
          <CardDescription className="text-base">
            Система мониторинга экипажей экстренных служб
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <Icon name="AlertCircle" size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="userId">ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Введите ID (5 цифр)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isLoading}
                maxLength={5}
                pattern="[0-9]{5}"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Войти в систему
                </>
              )}
            </Button>
            
            <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <p className="font-medium mb-1">Тестовые аккаунты:</p>
              <p>Менеджер: 10001 / Admin2024!</p>
              <p>Диспетчер: 10002 / Disp2024!</p>
              <p>Руководитель: 10003 / Super2024!</p>
              <p>Сотрудник: 10004 / Emp2024!</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;