import { type User } from './auth';

export interface Call {
  id: string;
  time: string;
  address: string;
  type: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'dispatched' | 'completed';
  assignedUnit?: string;
  assignedCrewId?: number;
  dispatcherId?: string;
  dispatcherName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Crew {
  id: number;
  unitName: string;
  status: 'available' | 'en-route' | 'on-scene' | 'unavailable';
  location?: string;
  lastUpdate: string;
}

export interface Dispatcher {
  id: string;
  fullName: string;
  email: string;
  status: 'active' | 'inactive';
}

const CALLS_KEY = 'mdc_calls';
const USERS_KEY = 'mdc_users';
const CREWS_KEY = 'mdc_crews';

const defaultCalls: Call[] = [
  { id: 'C-1024', time: '13:48', address: 'ул. Ленина, 45', type: 'ДТП', priority: 'urgent', status: 'dispatched', assignedUnit: 'NU-12', assignedCrewId: 2, dispatcherId: '10002', dispatcherName: 'Иванов И.И.', createdAt: new Date().toISOString() },
  { id: 'C-1023', time: '13:45', address: 'пр. Победы, 23', type: 'Пожар', priority: 'urgent', status: 'pending', createdAt: new Date().toISOString() },
  { id: 'C-1022', time: '13:30', address: 'пр. Мира, 120', type: 'Медицинская помощь', priority: 'high', status: 'dispatched', assignedUnit: 'NU-15', assignedCrewId: 3, dispatcherId: '10002', dispatcherName: 'Иванов И.И.', createdAt: new Date().toISOString() },
  { id: 'C-1021', time: '13:15', address: 'ул. Советская, 78', type: 'Проверка сигнализации', priority: 'medium', status: 'completed', assignedUnit: 'NU-10', assignedCrewId: 1, dispatcherId: '10002', dispatcherName: 'Иванов И.И.', createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
  { id: 'C-1020', time: '13:00', address: 'ул. Гагарина, 156', type: 'Медицинская помощь', priority: 'high', status: 'completed', assignedUnit: 'NU-07', assignedCrewId: 4, dispatcherId: '10002', dispatcherName: 'Иванов И.И.', createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
];

const defaultCrews: Crew[] = [
  { id: 1, unitName: 'NU-10', status: 'available', location: 'Станция №3', lastUpdate: new Date().toISOString() },
  { id: 2, unitName: 'NU-12', status: 'en-route', location: 'ул. Ленина, 45', lastUpdate: new Date().toISOString() },
  { id: 3, unitName: 'NU-15', status: 'on-scene', location: 'пр. Мира, 120', lastUpdate: new Date().toISOString() },
  { id: 4, unitName: 'NU-07', status: 'available', location: 'Станция №1', lastUpdate: new Date().toISOString() },
  { id: 5, unitName: 'NU-22', status: 'unavailable', location: 'Техобслуживание', lastUpdate: new Date().toISOString() },
  { id: 6, unitName: 'NU-18', status: 'en-route', location: 'ул. Гагарина, 78', lastUpdate: new Date().toISOString() },
];

const defaultUsers: User[] = [
  {
    id: '10001',
    fullName: 'Петров Петр Петрович',
    role: 'manager',
    email: 'manager@mdc.system'
  },
  {
    id: '10002',
    fullName: 'Иванов Иван Иванович',
    role: 'dispatcher',
    email: 'dispatcher@mdc.system'
  },
  {
    id: '10003',
    fullName: 'Сидоров Сергей Сергеевич',
    role: 'supervisor',
    email: 'supervisor@mdc.system'
  },
  {
    id: '10004',
    fullName: 'Васильев Василий Васильевич',
    role: 'employee',
    email: 'employee@mdc.system'
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

export const updateCallDispatcher = (callId: string, dispatcherId: string, dispatcherName: string): void => {
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
      const users = JSON.parse(stored);
      const needsMigration = users.some((u: any) => typeof u.id === 'number');
      if (needsMigration) {
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
      }
      return users;
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

export const deleteUser = (userId: string): void => {
  const users = getAllUsers();
  const filtered = users.filter(u => u.id !== userId);
  saveAllUsers(filtered);
};

export const updateUser = (userId: string, updates: Partial<User>): void => {
  const users = getAllUsers();
  const updated = users.map(u => 
    u.id === userId ? { ...u, ...updates } : u
  );
  saveAllUsers(updated);
};

export const createUser = (userId: string, password: string, user: Omit<User, 'id'>): User => {
  const users = getAllUsers();
  const newUser = {
    ...user,
    id: userId
  };
  saveAllUsers([...users, newUser]);
  
  const usersWithPassword = JSON.parse(localStorage.getItem('mdc_users_passwords') || '[]');
  usersWithPassword.push({ id: userId, password });
  localStorage.setItem('mdc_users_passwords', JSON.stringify(usersWithPassword));
  
  return newUser;
};

export const getCrews = (): Crew[] => {
  const stored = localStorage.getItem(CREWS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultCrews;
    }
  }
  localStorage.setItem(CREWS_KEY, JSON.stringify(defaultCrews));
  return defaultCrews;
};

export const saveCrews = (crews: Crew[]): void => {
  localStorage.setItem(CREWS_KEY, JSON.stringify(crews));
};

export const updateCrewStatus = (crewId: number, status: Crew['status'], location?: string): void => {
  const crews = getCrews();
  const updated = crews.map(c => 
    c.id === crewId ? { ...c, status, location: location || c.location, lastUpdate: new Date().toISOString() } : c
  );
  saveCrews(updated);
};

export const createCall = (call: Omit<Call, 'id' | 'time' | 'createdAt'>): Call => {
  const calls = getCalls();
  const newId = Math.max(...calls.map(c => parseInt(c.id.split('-')[1])), 1000) + 1;
  const now = new Date();
  const newCall = {
    ...call,
    id: `C-${newId}`,
    time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    createdAt: now.toISOString()
  };
  saveCalls([newCall, ...calls]);
  return newCall;
};

export const updateCallStatus = (callId: string, status: Call['status']): void => {
  const calls = getCalls();
  const updated = calls.map(c => {
    if (c.id === callId) {
      const updates: Partial<Call> = { status };
      if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
      }
      return { ...c, ...updates };
    }
    return c;
  });
  saveCalls(updated);
};

export const assignCrewToCall = (callId: string, crewId: number): void => {
  const calls = getCalls();
  const crews = getCrews();
  const crew = crews.find(c => c.id === crewId);
  
  if (crew) {
    const updated = calls.map(c => 
      c.id === callId ? { ...c, assignedCrewId: crewId, assignedUnit: crew.unitName, status: 'dispatched' as const } : c
    );
    saveCalls(updated);
    updateCrewStatus(crewId, 'en-route');
  }
};

export const getDispatcherStats = (dispatcherId: string) => {
  const calls = getCalls();
  const dispatcherCalls = calls.filter(c => c.dispatcherId === dispatcherId);
  
  return {
    totalCalls: dispatcherCalls.length,
    completedCalls: dispatcherCalls.filter(c => c.status === 'completed').length,
    activeCalls: dispatcherCalls.filter(c => c.status === 'dispatched').length,
    pendingCalls: dispatcherCalls.filter(c => c.status === 'pending').length,
    urgentCalls: dispatcherCalls.filter(c => c.priority === 'urgent').length,
  };
};