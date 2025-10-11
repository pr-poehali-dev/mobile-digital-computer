import { type User } from './auth';

export const canDeleteCalls = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const canDeleteLogs = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const canEditDispatchers = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const canManageAccounts = (user: User | null): boolean => {
  return user?.role === 'manager' || user?.role === 'supervisor';
};

export const isManager = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const isDispatcher = (user: User | null): boolean => {
  return user?.role === 'dispatcher';
};

export const isSupervisor = (user: User | null): boolean => {
  return user?.role === 'supervisor';
};

export const isEmployee = (user: User | null): boolean => {
  return user?.role === 'employee';
};

const roleHierarchy: Record<string, number> = {
  'manager': 4,
  'supervisor': 3,
  'dispatcher': 2,
  'employee': 1
};

export const canFreezeUser = (currentUser: User | null, targetUser: User): boolean => {
  if (!currentUser) return false;
  
  if (currentUser.role !== 'manager' && currentUser.role !== 'supervisor') {
    return false;
  }
  
  const currentUserLevel = roleHierarchy[currentUser.role] || 0;
  const targetUserLevel = roleHierarchy[targetUser.role] || 0;
  
  return currentUserLevel > targetUserLevel;
};