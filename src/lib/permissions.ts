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