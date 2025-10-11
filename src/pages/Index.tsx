import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import { getUserSession, clearUserSession, type User } from '@/lib/auth';
import { addOnlineUser, removeOnlineUser, addActivityLog } from '@/lib/store';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getUserSession();
    if (user) {
      if (typeof user.id === 'number') {
        clearUserSession();
        setIsLoading(false);
        return;
      }
      setCurrentUser(user);
      setIsAuthenticated(true);
      addOnlineUser(user);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      // Отправляем heartbeat каждые 5 секунд
      const heartbeatInterval = setInterval(() => {
        addOnlineUser(currentUser);
      }, 5000);
      
      // Удаляем пользователя только при настоящем выходе
      const handleBeforeUnload = () => {
        removeOnlineUser(currentUser.id);
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        clearInterval(heartbeatInterval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        removeOnlineUser(currentUser.id);
      };
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    addOnlineUser(user);
    
    addActivityLog({
      type: 'crew_status',
      userId: user.id,
      userName: user.fullName,
      description: `Вход в систему`,
      details: `Роль: ${user.role}`
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      removeOnlineUser(currentUser.id);
    }
    clearUserSession();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Загрузка...</div>
      </div>
    );
  }

  console.log('[Index] isAuthenticated:', isAuthenticated);
  console.log('[Index] currentUser:', currentUser);
  console.log('[Index] currentUser?.role:', currentUser?.role);
  
  if (!isAuthenticated) {
    console.log('[Index] Показываю LoginPage');
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentUser?.role === 'employee') {
    console.log('[Index] Показываю EmployeeDashboard');
    return <EmployeeDashboard onLogout={handleLogout} currentUser={currentUser} />;
  }

  console.log('[Index] Показываю Dashboard (dispatcher/admin)');
  return <Dashboard onLogout={handleLogout} currentUser={currentUser} />;
};

export default Index;