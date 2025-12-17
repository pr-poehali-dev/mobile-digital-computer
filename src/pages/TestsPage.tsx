import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import { getUserSession, clearUserSession, type User } from '@/lib/auth';
import { addOnlineUser, removeOnlineUser } from '@/lib/store';
import { syncManager } from '@/lib/sync-manager';

const TestsPage = () => {
  const navigate = useNavigate();
  const currentUser = getUserSession();

  useEffect(() => {
    if (!currentUser || typeof currentUser.id !== 'string') {
      clearUserSession();
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'employee') {
      navigate('/mdc');
      return;
    }

    addOnlineUser(currentUser);

    const heartbeatInterval = setInterval(() => {
      addOnlineUser(currentUser);
    }, 5000);

    const handleBeforeUnload = () => {
      removeOnlineUser(currentUser.id);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleLockdownChange = (event: any) => {
      if (event.detail?.active) {
        handleLogout();
      }
    };

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
  }, [currentUser, navigate]);

  const handleLogout = () => {
    if (currentUser) {
      removeOnlineUser(currentUser.id);
    }
    clearUserSession();
    navigate('/login');
  };

  if (!currentUser) {
    return null;
  }

  return <EmployeeDashboard onLogout={handleLogout} currentUser={currentUser} />;
};

export default TestsPage;
