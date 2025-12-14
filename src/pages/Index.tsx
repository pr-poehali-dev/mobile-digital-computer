import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import RegisterPage from '@/components/RegisterPage';
import Dashboard from '@/components/Dashboard';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import { getUserSession, clearUserSession, type User } from '@/lib/auth';
import { addOnlineUser, removeOnlineUser, addActivityLog, isSystemLocked } from '@/lib/store';
import { syncManager } from '@/lib/sync-manager';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

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
      
      // Слушаем события блокировки системы
      const handleLockdownChange = (event: any) => {
        if (event.detail?.active && currentUser.role !== 'manager') {
          handleLogout();
        }
      };
      
      // Слушаем события изменения пользователей (для заморозки)
      const handleUsersUpdate = () => {
        const usersData = localStorage.getItem('mdc_users');
        if (usersData) {
          const users = JSON.parse(usersData);
          const updatedUser = users.find((u: User) => u.id === currentUser.id);
          if (updatedUser?.frozen) {
            handleLogout();
          }
        }
      };
      
      syncManager.addEventListener('system_lockdown_changed', handleLockdownChange);
      syncManager.addEventListener('users_updated', handleUsersUpdate);
      
      return () => {
        clearInterval(heartbeatInterval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        syncManager.removeEventListener('system_lockdown_changed', handleLockdownChange);
        syncManager.removeEventListener('users_updated', handleUsersUpdate);
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

  if (!isAuthenticated) {
    if (showRegister) {
      return <RegisterPage onBackToLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onLogin={handleLogin} onRegister={() => setShowRegister(true)} />;
  }

  if (currentUser?.role === 'employee') {
    return <EmployeeDashboard onLogout={handleLogout} currentUser={currentUser} />;
  }

  return <Dashboard onLogout={handleLogout} currentUser={currentUser} />;
};

export default Index;