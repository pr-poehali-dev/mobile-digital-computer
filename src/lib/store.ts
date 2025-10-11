import { type User } from './auth';
import { syncManager } from './sync-manager';
import { sanitizeText, sanitizeName, sanitizeAddress, sanitizeEmail, sanitizeId } from './sanitize';

// ============================================================================
// TYPES
// ============================================================================

export interface Call {
  id: string;
  time: string;
  address: string;
  type: string;
  priority: 'code99' | 'code3' | 'code2';
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
  members: string[];
  panicActive?: boolean;
  panicTriggeredAt?: string;
  panicTriggeredBy?: string;
  signal100Active?: boolean;
  signal100TriggeredAt?: string;
  signal100TriggeredBy?: string;
}

export interface Dispatcher {
  id: string;
  fullName: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface DispatcherShift {
  dispatcherId: string;
  dispatcherName: string;
  startTime: string;
  isActive: boolean;
}

export interface Signal100Alert {
  id: string;
  active: boolean;
  triggeredAt: string;
  triggeredBy: string;
  triggeredByName: string;
  crewId?: number;
  crewName?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'crew_status' | 'crew_created' | 'crew_deleted' | 'call_assigned' | 'call_completed' | 'panic_activated' | 'panic_reset' | 'signal100_activated' | 'signal100_reset';
  userId: string;
  userName: string;
  crewId?: number;
  crewName?: string;
  description: string;
  details?: string;
}

interface OnlineUserWithTimestamp extends User {
  lastHeartbeat?: number;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const KEYS = {
  CALLS: 'mdc_calls',
  USERS: 'mdc_users',
  USERS_PASSWORDS: 'mdc_users_passwords',
  CREWS: 'mdc_crews',
  DISPATCHER_SHIFTS: 'mdc_dispatcher_shifts',
  ACTIVITY_LOG: 'mdc_activity_log',
  ONLINE_USERS: 'mdc_online_users',
  PANIC_ALERTS: 'mdc_panic_alerts',
  SIGNAL100_ALERT: 'mdc_signal100_alert',
  SIGNAL100_LAST_RESET: 'mdc_signal100_last_reset',
} as const;



// ============================================================================
// STORAGE HELPERS
// ============================================================================

const storage = {
  get<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  },

  set(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
    
    // Уведомляем другие вкладки через syncManager
    const eventMap: Record<string, any> = {
      [KEYS.CREWS]: 'crews_updated',
      [KEYS.CALLS]: 'calls_updated',
      [KEYS.USERS]: 'users_updated',
      [KEYS.DISPATCHER_SHIFTS]: 'dispatcher_shift_changed',
      [KEYS.ONLINE_USERS]: 'online_users_changed',
      [KEYS.ACTIVITY_LOG]: 'activity_log_updated',
    };
    
    const eventType = eventMap[key];
    if (eventType) {
      syncManager.notify(eventType, { key, value });
    }
  },
};

// ============================================================================
// DEFAULT DATA
// ============================================================================

const defaultCalls: Call[] = [
  { 
    id: 'C-1024', 
    time: '13:48', 
    address: 'ул. Ленина, 45', 
    type: 'ДТП', 
    priority: 'code99', 
    status: 'dispatched', 
    assignedUnit: 'NU-12', 
    assignedCrewId: 2, 
    dispatcherId: '10002', 
    dispatcherName: 'Иванов И.И.', 
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'C-1023', 
    time: '13:45', 
    address: 'пр. Победы, 23', 
    type: 'Пожар', 
    priority: 'code99', 
    status: 'pending', 
    createdAt: new Date().toISOString() 
  },
];

const defaultUsers: User[] = [
  { id: '10001', fullName: 'Петров Петр Петрович', role: 'manager', email: 'manager@mdc.system' },
  { id: '10002', fullName: 'Иванов Иван Иванович', role: 'dispatcher', email: 'dispatcher@mdc.system' },
  { id: '10003', fullName: 'Сидоров Сергей Сергеевич', role: 'supervisor', email: 'supervisor@mdc.system' },
  { id: '10004', fullName: 'Васильев Василий Васильевич', role: 'employee', email: 'employee@mdc.system' },
];

// ============================================================================
// CALLS API
// ============================================================================

export const getCalls = (): Call[] => storage.get(KEYS.CALLS, defaultCalls);

export const saveCalls = (calls: Call[]): void => {
  storage.set(KEYS.CALLS, calls);
  syncManager.notify('calls_updated');
};

export const createCall = (call: Omit<Call, 'id' | 'time' | 'createdAt'>, creatorId?: string): Call => {
  const calls = getCalls();
  const newId = Math.max(...calls.map(c => parseInt(c.id.split('-')[1])), 1000) + 1;
  const now = new Date();
  
  let dispatcherId = call.dispatcherId;
  let dispatcherName = call.dispatcherName;
  
  if (creatorId && !dispatcherId) {
    const users = getAllUsers();
    const creator = users.find(u => u.id === creatorId);
    if (creator && creator.role === 'dispatcher' && isUserOnDuty(creatorId)) {
      dispatcherId = creatorId;
      dispatcherName = creator.fullName;
    }
  }
  
  const newCall = {
    ...call,
    id: `C-${newId}`,
    time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    address: sanitizeAddress(call.address),
    type: sanitizeText(call.type),
    createdAt: now.toISOString(),
    dispatcherId,
    dispatcherName
  };
  saveCalls([newCall, ...calls]);
  return newCall;
};

export const updateCallStatus = (callId: string, status: Call['status']): void => {
  const calls = getCalls();
  const call = calls.find(c => c.id === callId);
  const updated = calls.map(c => {
    if (c.id === callId) {
      const updates: Partial<Call> = { status };
      if (status === 'completed') updates.completedAt = new Date().toISOString();
      return { ...c, ...updates };
    }
    return c;
  });
  saveCalls(updated);
  
  if (call && status === 'completed' && call.assignedCrewId) {
    const crews = getCrews();
    const crew = crews.find(c => c.id === call.assignedCrewId);
    if (crew) {
      crew.members.forEach(memberId => {
        const users = getAllUsers();
        const user = users.find(u => u.id === memberId);
        addActivityLog({
          type: 'call_completed',
          userId: memberId,
          userName: user?.fullName || 'Неизвестный',
          crewId: crew.id,
          crewName: crew.unitName,
          description: `Завершен вызов ${callId}`,
          details: `${call.type} — ${call.address}`
        });
      });
    }
  }
};

export const updateCallDispatcher = (callId: string, dispatcherId: string, dispatcherName: string): void => {
  const calls = getCalls();
  const updated = calls.map(c => 
    c.id === callId ? { ...c, dispatcherId, dispatcherName } : c
  );
  saveCalls(updated);
};

export const deleteCall = (callId: string): void => {
  const calls = getCalls();
  saveCalls(calls.filter(c => c.id !== callId));
};

export const deleteCalls = (callIds: string[]): void => {
  const calls = getCalls();
  saveCalls(calls.filter(c => !callIds.includes(c.id)));
};

export const clearAllCalls = (): void => {
  saveCalls([]);
};

export const assignCrewToCall = (callId: string, crewId: number, dispatcherId?: string): void => {
  const calls = getCalls();
  const crews = getCrews();
  const crew = crews.find(c => c.id === crewId);
  const call = calls.find(c => c.id === callId);
  
  if (crew && call) {
    let finalDispatcherId = call.dispatcherId;
    let finalDispatcherName = call.dispatcherName;
    
    if (dispatcherId && !finalDispatcherId) {
      const users = getAllUsers();
      const dispatcher = users.find(u => u.id === dispatcherId);
      if (dispatcher && dispatcher.role === 'dispatcher' && isUserOnDuty(dispatcherId)) {
        finalDispatcherId = dispatcherId;
        finalDispatcherName = dispatcher.fullName;
      }
    }
    
    const updated = calls.map(c => 
      c.id === callId ? { 
        ...c, 
        assignedCrewId: crewId, 
        assignedUnit: crew.unitName, 
        status: 'dispatched' as const,
        dispatcherId: finalDispatcherId,
        dispatcherName: finalDispatcherName
      } : c
    );
    saveCalls(updated);
    updateCrewStatus(crewId, 'en-route');
    
    crew.members.forEach(memberId => {
      const users = getAllUsers();
      const user = users.find(u => u.id === memberId);
      addActivityLog({
        type: 'call_assigned',
        userId: memberId,
        userName: user?.fullName || 'Неизвестный',
        crewId,
        crewName: crew.unitName,
        description: `Назначен на вызов ${callId}`,
        details: `${call.type} — ${call.address}`
      });
    });
  }
};

export const getCrewCalls = (crewId: number): Call[] => {
  const calls = getCalls();
  return calls.filter(c => c.assignedCrewId === crewId && c.status !== 'completed');
};

// ============================================================================
// USERS API
// ============================================================================

export const getAllUsers = (): User[] => {
  const users = storage.get<User[]>(KEYS.USERS, []);
  
  if (users.length === 0 || users.some((u: any) => typeof u.id === 'number')) {
    storage.set(KEYS.USERS, defaultUsers);
    return defaultUsers;
  }
  
  return users;
};

export const saveAllUsers = (users: User[]): void => {
  storage.set(KEYS.USERS, users);
  syncManager.notify('users_updated');
};

export const createUser = (userId: string, password: string, user: Omit<User, 'id'>): User => {
  const users = getAllUsers();
  const newUser = { 
    ...user, 
    id: sanitizeId(userId),
    fullName: sanitizeName(user.fullName),
    email: sanitizeEmail(user.email)
  };
  saveAllUsers([...users, newUser]);
  
  const usersWithPassword = storage.get<any[]>(KEYS.USERS_PASSWORDS, []);
  usersWithPassword.push({ id: sanitizeId(userId), password });
  storage.set(KEYS.USERS_PASSWORDS, usersWithPassword);
  
  return newUser;
};

export const updateUser = (userId: string, updates: Partial<User>): void => {
  const users = getAllUsers();
  const sanitizedUpdates: Partial<User> = {
    ...updates,
    ...(updates.fullName && { fullName: sanitizeName(updates.fullName) }),
    ...(updates.email && { email: sanitizeEmail(updates.email) })
  };
  saveAllUsers(users.map(u => u.id === userId ? { ...u, ...sanitizedUpdates } : u));
};

export const deleteUser = (userId: string): void => {
  const users = getAllUsers();
  saveAllUsers(users.filter(u => u.id !== userId));
};

export const changeUserId = (oldUserId: string, newUserId: string): boolean => {
  const users = getAllUsers();
  
  if (users.some(u => u.id === newUserId)) {
    return false;
  }
  
  const userToUpdate = users.find(u => u.id === oldUserId);
  if (!userToUpdate) {
    return false;
  }
  
  const updatedUsers = users.map(u => 
    u.id === oldUserId ? { ...u, id: newUserId } : u
  );
  saveAllUsers(updatedUsers);
  
  const usersWithPassword = storage.get<any[]>(KEYS.USERS_PASSWORDS, []);
  const updatedPasswords = usersWithPassword.map(u => 
    u.id === oldUserId ? { ...u, id: newUserId } : u
  );
  storage.set(KEYS.USERS_PASSWORDS, updatedPasswords);
  
  const crews = getCrews();
  const updatedCrews = crews.map(crew => ({
    ...crew,
    members: crew.members.map(memberId => 
      memberId === oldUserId ? newUserId : memberId
    )
  }));
  saveCrews(updatedCrews);
  
  return true;
};

// ============================================================================
// CREWS STORAGE (TEMPORARY LOCAL MODE)
// ============================================================================

export const getCrews = (): Crew[] => {
  const crews = storage.get<Crew[]>(KEYS.CREWS, []);
  console.log('[getCrews] Загрузка экипажей из localStorage:', crews);
  return crews;
};

export const saveCrews = (crews: Crew[]): void => {
  storage.set(KEYS.CREWS, crews);
  syncManager.notify('crews_updated');
};

export const createCrew = async (unitName: string, members: string[], creatorId?: string): Promise<Crew | null> => {
  const crews = getCrews();
  const newId = crews.length > 0 ? Math.max(...crews.map(c => c.id)) + 1 : 1;
  
  const newCrew: Crew = {
    id: newId,
    unitName: sanitizeName(unitName),
    status: 'available',
    location: 'Станция',
    members: members.map(m => sanitizeId(m)),
    lastUpdate: new Date().toISOString()
  };
  
  console.log('[createCrew] Создание экипажа:', { newCrew, existingCrews: crews.length, creatorId });
  
  storage.set(KEYS.CREWS, [...crews, newCrew]);
  
  const saved = storage.get<Crew[]>(KEYS.CREWS, []);
  console.log('[createCrew] После сохранения в localStorage:', saved);
  
  syncManager.notify('crews_updated');
  
  if (creatorId) {
    const users = getAllUsers();
    const user = users.find(u => u.id === creatorId);
    addActivityLog({
      type: 'crew_created',
      userId: creatorId,
      userName: user?.fullName || 'Неизвестный',
      crewId: newId,
      crewName: unitName,
      description: `Создан экипаж ${unitName}`,
      details: `Состав: ${members.length} чел.`
    });
  }
  
  return newCrew;
};

export const updateCrew = async (crewId: number, unitName: string, members: string[]): Promise<void> => {
  const crews = getCrews();
  const updatedCrews = crews.map(crew => 
    crew.id === crewId 
      ? { 
          ...crew, 
          unitName: sanitizeName(unitName), 
          members: members.map(m => sanitizeId(m)), 
          lastUpdate: new Date().toISOString() 
        }
      : crew
  );
  
  storage.set(KEYS.CREWS, updatedCrews);
  syncManager.notify('crews_updated');
};

export const updateCrewStatus = async (crewId: number, status: Crew['status'], location?: string, userId?: string): Promise<void> => {
  const crews = getCrews();
  const crew = crews.find(c => c.id === crewId);
  
  if (crew) {
    const sanitizedLocation = location ? sanitizeAddress(location) : crew.location;
    const updatedCrews = crews.map(c => 
      c.id === crewId
        ? { ...c, status, location: sanitizedLocation, lastUpdate: new Date().toISOString() }
        : c
    );
    
    storage.set(KEYS.CREWS, updatedCrews);
    syncManager.notify('crews_updated');
    
    if (userId) {
      const users = getAllUsers();
      const user = users.find(u => u.id === userId);
      const statusLabels = { 
        available: 'Доступен', 
        'en-route': 'В пути', 
        'on-scene': 'На месте', 
        unavailable: 'Недоступен' 
      };
      addActivityLog({
        type: 'crew_status',
        userId,
        userName: user?.fullName || 'Неизвестный',
        crewId,
        crewName: crew.unitName,
        description: `Статус экипажа изменен на: ${statusLabels[status]}`,
        details: location || undefined
      });
    }
  }
};

export const deleteCrew = async (crewId: number, userId?: string): Promise<void> => {
  const crews = getCrews();
  const crew = crews.find(c => c.id === crewId);
  
  const updatedCrews = crews.filter(c => c.id !== crewId);
  storage.set(KEYS.CREWS, updatedCrews);
  syncManager.notify('crews_updated');
  
  if (crew && userId) {
    const users = getAllUsers();
    const user = users.find(u => u.id === userId);
    addActivityLog({
      type: 'crew_deleted',
      userId,
      userName: user?.fullName || 'Неизвестный',
      crewId,
      crewName: crew.unitName,
      description: `Удален экипаж ${crew.unitName}`,
    });
  }
};

export const getUserCrew = (userId: string): Crew | null => {
  const crews = getCrews();
  return crews.find(c => c.members.includes(userId)) || null;
};

// ============================================================================
// PANIC BUTTON API
// ============================================================================

export const activatePanic = (crewId: number, userId: string): void => {
  const crews = getCrews();
  const crew = crews.find(c => c.id === crewId);
  
  if (!crew) return;
  
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  
  const updatedCrews = crews.map(c => 
    c.id === crewId
      ? { 
          ...c, 
          panicActive: true, 
          panicTriggeredAt: new Date().toISOString(),
          panicTriggeredBy: userId
        }
      : c
  );
  
  storage.set(KEYS.CREWS, updatedCrews);
  syncManager.notify('crews_updated');
  
  const panicCall = createCall({
    address: crew.location || 'Местоположение неизвестно',
    type: '🚨 КНОПКА ПАНИКИ',
    priority: 'code99',
    status: 'dispatched',
    assignedUnit: crew.unitName,
    assignedCrewId: crewId,
  });
  
  addActivityLog({
    type: 'panic_activated',
    userId,
    userName: user?.fullName || 'Неизвестный',
    crewId,
    crewName: crew.unitName,
    description: `🚨 ТРЕВОГА! Экипаж ${crew.unitName} активировал кнопку паники`,
    details: crew.location || 'Местоположение неизвестно'
  });
  
  activateSignal100(crewId, userId);
};

export const resetPanic = (crewId: number, userId: string): void => {
  const crews = getCrews();
  const crew = crews.find(c => c.id === crewId);
  
  if (!crew || !crew.panicActive) return;
  
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  
  const updatedCrews = crews.map(c => 
    c.id === crewId
      ? { 
          ...c, 
          panicActive: false, 
          panicTriggeredAt: undefined,
          panicTriggeredBy: undefined
        }
      : c
  );
  
  storage.set(KEYS.CREWS, updatedCrews);
  syncManager.notify('crews_updated');
  
  const resetReason = userId === 'system' 
    ? 'автоматически через 10 минут'
    : `диспетчером ${user?.fullName || 'Неизвестный'}`;
  
  addActivityLog({
    type: 'panic_reset',
    userId,
    userName: user?.fullName || 'Система',
    crewId,
    crewName: crew.unitName,
    description: `Сигнал тревоги сброшен для экипажа ${crew.unitName}`,
    details: `Причина: ${resetReason}`
  });
};

export const getActivePanicAlerts = (): Crew[] => {
  const crews = getCrews();
  const now = Date.now();
  
  const activeAlerts = crews.filter(c => {
    if (!c.panicActive) return false;
    
    if (c.panicTriggeredAt) {
      const triggeredTime = new Date(c.panicTriggeredAt).getTime();
      const elapsed = now - triggeredTime;
      
      if (elapsed >= 10 * 60 * 1000) {
        resetPanic(c.id, 'system');
        return false;
      }
    }
    
    return true;
  });
  
  return activeAlerts;
};

// ============================================================================
// SIGNAL 100 API
// ============================================================================

export const canActivateSignal100 = (): { canActivate: boolean; remainingSeconds: number } => {
  const lastReset = storage.get<number>(KEYS.SIGNAL100_LAST_RESET, 0);
  const now = Date.now();
  const elapsed = now - lastReset;
  const cooldown = 30 * 1000;
  
  if (elapsed < cooldown) {
    return {
      canActivate: false,
      remainingSeconds: Math.ceil((cooldown - elapsed) / 1000)
    };
  }
  
  return { canActivate: true, remainingSeconds: 0 };
};

export const activateSignal100 = (crewId: number | null, userId: string): void => {
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  
  let crewName = '';
  
  if (crewId !== null) {
    const crews = getCrews();
    const crew = crews.find(c => c.id === crewId);
    
    if (!crew) return;
    
    crewName = crew.unitName;
    
    const updatedCrews = crews.map(c => 
      c.id === crewId
        ? { 
            ...c, 
            signal100Active: true, 
            signal100TriggeredAt: new Date().toISOString(),
            signal100TriggeredBy: userId
          }
        : c
    );
    
    storage.set(KEYS.CREWS, updatedCrews);
    syncManager.notify('crews_updated');
  }
  
  const signal100Alert: Signal100Alert = {
    id: `SIGNAL100-${Date.now()}`,
    active: true,
    triggeredAt: new Date().toISOString(),
    triggeredBy: userId,
    triggeredByName: user?.fullName || 'Неизвестный',
    crewId: crewId || undefined,
    crewName: crewName || undefined
  };
  
  storage.set(KEYS.SIGNAL100_ALERT, signal100Alert);
  syncManager.notify('signal100_changed', { key: KEYS.SIGNAL100_ALERT, value: signal100Alert });
  
  addActivityLog({
    type: 'signal100_activated',
    userId,
    userName: user?.fullName || 'Неизвестный',
    crewId: crewId || undefined,
    crewName: crewName || undefined,
    description: `🟡 СИГНАЛ 100 активирован`,
    details: crewName ? `Экипаж: ${crewName}` : 'Активирован диспетчером'
  });
};

export const resetSignal100 = (userId: string): void => {
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  const signal100 = getActiveSignal100();
  
  if (!signal100) return;
  
  const crews = getCrews();
  const updatedCrews = crews.map(c => ({
    ...c,
    signal100Active: false,
    signal100TriggeredAt: undefined,
    signal100TriggeredBy: undefined
  }));
  
  storage.set(KEYS.CREWS, updatedCrews);
  storage.set(KEYS.SIGNAL100_ALERT, null);
  
  if (userId !== 'system') {
    storage.set(KEYS.SIGNAL100_LAST_RESET, Date.now());
  }
  
  syncManager.notify('crews_updated');
  syncManager.notify('signal100_changed', { key: KEYS.SIGNAL100_ALERT, value: null });
  
  const resetReason = userId === 'system' 
    ? 'автоматически через 10 минут'
    : `пользователем ${user?.fullName || 'Неизвестный'}`;
  
  addActivityLog({
    type: 'signal100_reset',
    userId,
    userName: user?.fullName || 'Система',
    crewId: signal100.crewId,
    crewName: signal100.crewName,
    description: `Сигнал 100 отменен`,
    details: `Причина: ${resetReason}`
  });
};

export const getActiveSignal100 = (): Signal100Alert | null => {
  const signal100 = storage.get<Signal100Alert | null>(KEYS.SIGNAL100_ALERT, null);
  
  if (!signal100 || !signal100.active) return null;
  
  const now = Date.now();
  const triggeredTime = new Date(signal100.triggeredAt).getTime();
  const elapsed = now - triggeredTime;
  
  if (elapsed >= 10 * 60 * 1000) {
    resetSignal100('system');
    return null;
  }
  
  return signal100;
};

// ============================================================================
// ONLINE USERS API
// ============================================================================

export const getOnlineUsers = (): User[] => {
  const users = storage.get<OnlineUserWithTimestamp[]>(KEYS.ONLINE_USERS, []);
  const now = Date.now();
  const timeout = 15000;
  
  const activeUsers = users.filter(u => {
    if (!u.lastHeartbeat) return false;
    return (now - u.lastHeartbeat) < timeout;
  });
  
  if (activeUsers.length !== users.length) {
    storage.set(KEYS.ONLINE_USERS, activeUsers);
  }
  
  return activeUsers;
};

export const addOnlineUser = (user: User): void => {
  const online = getOnlineUsers() as OnlineUserWithTimestamp[];
  const existingIndex = online.findIndex(u => u.id === user.id);
  const userWithTimestamp: OnlineUserWithTimestamp = { ...user, lastHeartbeat: Date.now() };
  
  if (existingIndex >= 0) {
    online[existingIndex] = userWithTimestamp;
  } else {
    online.push(userWithTimestamp);
  }
  
  storage.set(KEYS.ONLINE_USERS, online);
  syncManager.notify('online_users_changed');
};

export const removeOnlineUser = (userId: string): void => {
  const online = getOnlineUsers();
  storage.set(KEYS.ONLINE_USERS, online.filter(u => u.id !== userId));
  syncManager.notify('online_users_changed');
};

export const getAvailableCrewMembers = (): User[] => {
  const excludedRoles = ['manager', 'dispatcher', 'supervisor'];
  const allUsers = getAllUsers();
  return allUsers.filter(u => !excludedRoles.includes(u.role));
};

// ============================================================================
// DISPATCHER SHIFTS API
// ============================================================================

export const getActiveDispatcherShifts = (): DispatcherShift[] => {
  return storage.get<DispatcherShift[]>(KEYS.DISPATCHER_SHIFTS, []);
};

export const startDispatcherShift = (dispatcher: User): void => {
  const shifts = getActiveDispatcherShifts();
  const alreadyOnDuty = shifts.find(s => s.dispatcherId === dispatcher.id);
  
  if (!alreadyOnDuty) {
    const newShift: DispatcherShift = {
      dispatcherId: dispatcher.id,
      dispatcherName: dispatcher.fullName,
      startTime: new Date().toISOString(),
      isActive: true
    };
    shifts.push(newShift);
    storage.set(KEYS.DISPATCHER_SHIFTS, shifts);
    syncManager.notify('dispatcher_shift_changed');
  }
};

export const endDispatcherShift = (dispatcherId: string): void => {
  const shifts = getActiveDispatcherShifts();
  storage.set(KEYS.DISPATCHER_SHIFTS, shifts.filter(s => s.dispatcherId !== dispatcherId));
  syncManager.notify('dispatcher_shift_changed');
};

export const getActiveDispatcherShift = (): DispatcherShift | null => {
  const shifts = getActiveDispatcherShifts();
  return shifts.length > 0 ? shifts[0] : null;
};

export const isDispatcherOnDuty = (): boolean => {
  return getActiveDispatcherShifts().length > 0;
};

export const isUserOnDuty = (userId: string): boolean => {
  const shifts = getActiveDispatcherShifts();
  return shifts.some(s => s.dispatcherId === userId);
};

// ============================================================================
// ACTIVITY LOGS API
// ============================================================================

export const getActivityLogs = (): ActivityLog[] => {
  const logs = storage.get<ActivityLog[]>(KEYS.ACTIVITY_LOG, []);
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return logs.filter(log => new Date(log.timestamp).getTime() > oneDayAgo);
};

export const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>): void => {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    ...log,
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    userName: sanitizeName(log.userName),
    description: sanitizeText(log.description),
    details: log.details ? sanitizeText(log.details) : undefined,
    crewName: log.crewName ? sanitizeName(log.crewName) : undefined
  };
  logs.unshift(newLog);
  storage.set(KEYS.ACTIVITY_LOG, logs);
  syncManager.notify('logs_updated');
};

export const getUserActivityLogs = (userId: string): ActivityLog[] => {
  const logs = getActivityLogs();
  const crews = getCrews();
  const userCrews = crews.filter(c => c.members.includes(userId));
  const userCrewIds = userCrews.map(c => c.id);
  
  return logs.filter(log => 
    log.userId === userId || 
    (log.crewId && userCrewIds.includes(log.crewId))
  );
};

export const deleteActivityLog = (logId: string): void => {
  const logs = getActivityLogs();
  storage.set(KEYS.ACTIVITY_LOG, logs.filter(log => log.id !== logId));
  syncManager.notify('logs_updated');
};

export const deleteActivityLogs = (logIds: string[]): void => {
  const logs = getActivityLogs();
  storage.set(KEYS.ACTIVITY_LOG, logs.filter(log => !logIds.includes(log.id)));
  syncManager.notify('logs_updated');
};

export const clearAllActivityLogs = (): void => {
  storage.set(KEYS.ACTIVITY_LOG, []);
  syncManager.notify('logs_updated');
};

// ============================================================================
// STATISTICS API
// ============================================================================

export const getDispatcherStats = (dispatcherId: string) => {
  const calls = getCalls();
  const dispatcherCalls = calls.filter(c => c.dispatcherId === dispatcherId);
  
  const hourlyActivity = Array(24).fill(0);
  dispatcherCalls.forEach(call => {
    const hour = new Date(call.createdAt).getHours();
    hourlyActivity[hour]++;
  });
  
  return {
    totalCalls: dispatcherCalls.length,
    completedCalls: dispatcherCalls.filter(c => c.status === 'completed').length,
    activeCalls: dispatcherCalls.filter(c => c.status === 'dispatched').length,
    pendingCalls: dispatcherCalls.filter(c => c.status === 'pending').length,
    urgentCalls: dispatcherCalls.filter(c => c.priority === 'code99').length,
    hourlyActivity,
  };
};

export const getEmployeeStats = (userId: string) => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const crews = getCrews();
  const userCrews = crews.filter(c => c.members.includes(userId));
  const calls = getCalls();
  
  const userCalls = calls.filter(c => 
    c.assignedCrewId && 
    userCrews.some(crew => crew.id === c.assignedCrewId) &&
    new Date(c.createdAt).getTime() > oneDayAgo
  );
  
  return {
    totalCalls: userCalls.length,
    completedCalls: userCalls.filter(c => c.status === 'completed').length,
    activeCalls: userCalls.filter(c => c.status === 'dispatched').length,
    urgentCalls: userCalls.filter(c => c.priority === 'code99').length,
    highPriority: userCalls.filter(c => c.priority === 'code3').length,
  };
};

// ============================================================================
// AUTO SYNC - DISABLED (TEMPORARY LOCAL MODE)
// ============================================================================
// Auto sync with API is temporarily disabled due to billing issues
// Data is stored locally and synced between tabs via BroadcastChannel

// ============================================================================
// EXPORTS
// ============================================================================

export { syncManager };