import { type User } from './auth';

export interface Call {
  id: string;
  time: string;
  address: string;
  type: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'dispatched' | 'completed';
  assignedUnit?: string;
  dispatcherId?: number;
  dispatcherName?: string;
}

export interface Dispatcher {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

const CALLS_KEY = 'mdc_calls';
const USERS_KEY = 'mdc_users';

const defaultCalls: Call[] = [
  { id: 'C-1024', time: '13:48', address: 'ул. Ленина, 45', type: 'ДТП', priority: 'urgent', status: 'dispatched', assignedUnit: 'NU-12', dispatcherId: 2, dispatcherName: 'Иванов И.И.' },
  { id: 'C-1023', time: '13:45', address: 'пр. Победы, 23', type: 'Пожар', priority: 'urgent', status: 'pending' },
  { id: 'C-1022', time: '13:30', address: 'пр. Мира, 120', type: 'Медицинская помощь', priority: 'high', status: 'dispatched', assignedUnit: 'NU-15', dispatcherId: 2, dispatcherName: 'Иванов И.И.' },
  { id: 'C-1021', time: '13:15', address: 'ул. Советская, 78', type: 'Проверка сигнализации', priority: 'medium', status: 'completed', assignedUnit: 'NU-10', dispatcherId: 2, dispatcherName: 'Иванов И.И.' },
  { id: 'C-1020', time: '13:00', address: 'ул. Гагарина, 156', type: 'Медицинская помощь', priority: 'high', status: 'completed', assignedUnit: 'NU-07', dispatcherId: 2, dispatcherName: 'Иванов И.И.' },
];

const defaultUsers: User[] = [
  {
    id: 1,
    username: 'manager',
    fullName: 'Петров Петр Петрович',
    role: 'manager',
    email: 'manager@mdc.system',
    phone: '+7 (999) 000-11-22'
  },
  {
    id: 2,
    username: 'dispatcher',
    fullName: 'Иванов Иван Иванович',
    role: 'dispatcher',
    email: 'dispatcher@mdc.system',
    phone: '+7 (999) 123-45-67'
  }
];

export const getCalls = (): Call[] => {
  const stored = localStorage.getItem(CALLS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultCalls;
    }
  }
  return defaultCalls;
};

export const saveCalls = (calls: Call[]): void => {
  localStorage.setItem(CALLS_KEY, JSON.stringify(calls));
};

export const deleteCall = (callId: string): void => {
  const calls = getCalls();
  const filtered = calls.filter(c => c.id !== callId);
  saveCalls(filtered);
};

export const updateCallDispatcher = (callId: string, dispatcherId: number, dispatcherName: string): void => {
  const calls = getCalls();
  const updated = calls.map(c => 
    c.id === callId ? { ...c, dispatcherId, dispatcherName } : c
  );
  saveCalls(updated);
};

export const getAllUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultUsers;
    }
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};

export const saveAllUsers = (users: User[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const deleteUser = (userId: number): void => {
  const users = getAllUsers();
  const filtered = users.filter(u => u.id !== userId);
  saveAllUsers(filtered);
};

export const updateUser = (userId: number, updates: Partial<User>): void => {
  const users = getAllUsers();
  const updated = users.map(u => 
    u.id === userId ? { ...u, ...updates } : u
  );
  saveAllUsers(updated);
};

export const createUser = (user: Omit<User, 'id'>): User => {
  const users = getAllUsers();
  const newUser = {
    ...user,
    id: Math.max(...users.map(u => u.id), 0) + 1
  };
  saveAllUsers([...users, newUser]);
  return newUser;
};
