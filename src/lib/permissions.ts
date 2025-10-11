import { type User } from './auth';

export const canDeleteCalls = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const canEditDispatchers = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const canManageAccounts = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const isManager = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const isDispatcher = (user: User | null): boolean => {
  return user?.role === 'dispatcher';
};
