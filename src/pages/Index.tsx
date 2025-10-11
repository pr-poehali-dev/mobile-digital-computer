import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import { getUserSession, clearUserSession, type User } from '@/lib/auth';
import { addOnlineUser, removeOnlineUser } from '@/lib/store';

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
      const handleBeforeUnload = () => {
        removeOnlineUser(currentUser.id);
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    addOnlineUser(user);
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
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} currentUser={currentUser} />;
};

export default Index;