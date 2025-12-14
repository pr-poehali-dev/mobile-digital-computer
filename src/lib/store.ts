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

export interface UserSettings {
  userId: string;
  soundOnNewCall: boolean;
  statusNotifications: boolean;
}

export interface SystemLockdown {
  active: boolean;
  activatedAt?: string;
  activatedBy?: string;
}

export interface SystemRestrictions {
  dispatcherSystemDisabled: boolean;
  signal100Disabled: boolean;
  panicButtonDisabled: boolean;
  mdtSystemDisabled: boolean;
  survSystemEnabled: boolean;
}

export type ShiftStatus = 'off-shift' | 'on-shift' | 'on-break';

export interface ShiftSession {
  id: string;
  userId: string;
  status: ShiftStatus;
  startTime: string;
  endTime?: string;
  totalWorkTime: number;
  totalBreakTime: number;
  currentSessionStart?: string;
  lastHeartbeat: string;
}

export interface ShiftStatistics {
  userId: string;
  date: string;
  totalWorkTime: number;
  totalBreakTime: number;
  sessions: Array<{
    status: 'work' | 'break';
    startTime: string;
    endTime: string;
    duration: number;
  }>;
}

// ============================================================================
// TESTING SYSTEM TYPES
// ============================================================================

export type QuestionType = 'single' | 'multiple' | 'text';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // Для single/multiple
  correctAnswers?: number[]; // Индексы правильных ответов для single/multiple
  timeLimit?: number; // В секундах, undefined = без ограничения
  points: number;
}

export type ShowAnswersMode = 'immediate' | 'after-completion' | 'never';

export interface Test {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number; // Процент для прохождения (0-100)
  requiresManualCheck: boolean; // true если есть текстовые вопросы
  showAnswers: ShowAnswersMode; // Когда показывать правильные ответы
  createdBy: string;
  createdAt: string;
  randomizeQuestions?: boolean; // Рандомизировать порядок вопросов
  randomizeOptions?: boolean; // Рандомизировать порядок вариантов ответов
  questionBankSize?: number; // Размер банка вопросов (если указан, выбирается N случайных из всех)
}

export interface TestAssignment {
  id: string;
  testId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'passed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  score?: number;
  answers?: TestAnswer[];
  reviewedBy?: string;
  reviewedAt?: string;
  selectedQuestionIds?: string[]; // Список ID вопросов, выбранных для этого прохождения (для банка вопросов)
  questionOrder?: string[]; // Порядок вопросов для этого прохождения (для рандомизации)
  optionsOrder?: Record<string, number[]>; // Порядок вариантов для каждого вопроса (для рандомизации)
}

export interface TestAnswer {
  questionId: string;
  selectedOptions?: number[]; // Для single/multiple
  textAnswer?: string; // Для text
  timeSpent: number; // В секундах
  isCorrect?: boolean; // Для автоматической проверки
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const KEYS = {
  CALLS: 'mdc_calls',
  USERS: 'mdc_users_data',
  USERS_PASSWORDS: 'mdc_passwords',
  CREWS: 'mdc_crews',
  DISPATCHER_SHIFTS: 'mdc_dispatcher_shifts',
  ACTIVITY_LOG: 'mdc_activity_log',
  ONLINE_USERS: 'mdc_online_users',
  PANIC_ALERTS: 'mdc_panic_alerts',
  SIGNAL100_ALERT: 'mdc_signal100_alert',
  SIGNAL100_LAST_RESET: 'mdc_signal100_last_reset',
  SYSTEM_LOCKDOWN: 'mdc_system_lockdown',
  SYSTEM_RESTRICTIONS: 'mdc_system_restrictions',
  USER_SETTINGS: 'mdc_user_settings',
  SHIFT_SESSIONS: 'mdc_shift_sessions',
  SHIFT_STATISTICS: 'mdc_shift_statistics',
  TESTS: 'mdc_tests',
  TEST_ASSIGNMENTS: 'mdc_test_assignments',
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
      [KEYS.SYSTEM_LOCKDOWN]: 'system_lockdown_changed',
      [KEYS.SYSTEM_RESTRICTIONS]: 'system_restrictions_changed',
      [KEYS.USER_SETTINGS]: 'user_settings_changed',
      [KEYS.SHIFT_STATISTICS]: 'shift_statistics_updated',
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
    
    syncManager.notify('crew_assigned_to_call', { crewId, callId, members: crew.members });
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
  
  if (users.length === 0) {
    storage.set(KEYS.USERS, defaultUsers);
    return defaultUsers;
  }
  
  return users;
};

export const saveAllUsers = (users: User[]): void => {
  storage.set(KEYS.USERS, users);
  syncManager.notify('users_updated');
};

export const createUser = async (userId: string, password: string, user: Omit<User, 'id'>): Promise<User> => {
  const bcrypt = (await import('bcryptjs')).default;
  const users = getAllUsers();
  const newUser = { 
    ...user, 
    id: sanitizeId(userId),
    fullName: sanitizeName(user.fullName),
    email: sanitizeEmail(user.email)
  };
  saveAllUsers([...users, newUser]);
  
  const usersWithPassword = storage.get<any[]>(KEYS.USERS_PASSWORDS, []);
  const passwordHash = await bcrypt.hash(password, 10);
  usersWithPassword.push({ id: sanitizeId(userId), passwordHash });
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

export const freezeUser = (userId: string, frozenBy: string): void => {
  const users = getAllUsers();
  const updatedUsers = users.map(u => 
    u.id === userId 
      ? { ...u, frozen: true, frozenBy, frozenAt: new Date().toISOString() } 
      : u
  );
  saveAllUsers(updatedUsers);
  
  removeOnlineUser(userId);
};

export const unfreezeUser = (userId: string): void => {
  const users = getAllUsers();
  const updatedUsers = users.map(u => 
    u.id === userId 
      ? { ...u, frozen: false, frozenBy: undefined, frozenAt: undefined } 
      : u
  );
  saveAllUsers(updatedUsers);
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

export const changeUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
  const bcrypt = (await import('bcryptjs')).default;
  const passwordsData = localStorage.getItem(KEYS.USERS_PASSWORDS);
  const users = passwordsData ? JSON.parse(passwordsData) : [];
  
  const userIndex = users.findIndex((u: any) => u.id === userId);
  if (userIndex === -1) return false;
  
  const passwordHash = await bcrypt.hash(newPassword, 10);
  users[userIndex].passwordHash = passwordHash;
  
  localStorage.setItem(KEYS.USERS_PASSWORDS, JSON.stringify(users));
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
// SYSTEM LOCKDOWN API
// ============================================================================

export const getSystemLockdown = (): SystemLockdown => {
  return storage.get<SystemLockdown>(KEYS.SYSTEM_LOCKDOWN, { active: false });
};

export const activateSystemLockdown = (managerId: string): void => {
  const lockdown: SystemLockdown = {
    active: true,
    activatedAt: new Date().toISOString(),
    activatedBy: managerId
  };
  storage.set(KEYS.SYSTEM_LOCKDOWN, lockdown);
  syncManager.notify('system_lockdown_changed', lockdown);
  
  const onlineUsers = getOnlineUsers();
  onlineUsers.forEach(user => {
    if (user.role !== 'manager') {
      removeOnlineUser(user.id);
    }
  });
};

export const deactivateSystemLockdown = (): void => {
  const lockdown: SystemLockdown = { active: false };
  storage.set(KEYS.SYSTEM_LOCKDOWN, lockdown);
  syncManager.notify('system_lockdown_changed', lockdown);
};

export const isSystemLocked = (): boolean => {
  return getSystemLockdown().active;
};

// ============================================================================
// USER SETTINGS API
// ============================================================================

export const getUserSettings = (userId: string): UserSettings => {
  const allSettings = storage.get<UserSettings[]>(KEYS.USER_SETTINGS, []);
  const userSettings = allSettings.find(s => s.userId === userId);
  
  return userSettings || {
    userId,
    soundOnNewCall: true,
    statusNotifications: true
  };
};

export const updateUserSettings = (userId: string, settings: Partial<Omit<UserSettings, 'userId'>>): void => {
  const allSettings = storage.get<UserSettings[]>(KEYS.USER_SETTINGS, []);
  const existingIndex = allSettings.findIndex(s => s.userId === userId);
  
  const updatedSettings: UserSettings = {
    ...getUserSettings(userId),
    ...settings,
    userId
  };
  
  if (existingIndex >= 0) {
    allSettings[existingIndex] = updatedSettings;
  } else {
    allSettings.push(updatedSettings);
  }
  
  storage.set(KEYS.USER_SETTINGS, allSettings);
  syncManager.notify('user_settings_changed', { userId, settings: updatedSettings });
};

// ============================================================================
// SYSTEM RESTRICTIONS API
// ============================================================================

export const getSystemRestrictions = (): SystemRestrictions => {
  return storage.get<SystemRestrictions>(KEYS.SYSTEM_RESTRICTIONS, {
    dispatcherSystemDisabled: false,
    signal100Disabled: false,
    panicButtonDisabled: false,
    mdtSystemDisabled: false,
    survSystemEnabled: false
  });
};

export const updateSystemRestrictions = (restrictions: Partial<SystemRestrictions>): void => {
  const current = getSystemRestrictions();
  const updated = { ...current, ...restrictions };
  storage.set(KEYS.SYSTEM_RESTRICTIONS, updated);
  syncManager.notify('system_restrictions_changed', updated);
  
  if (restrictions.dispatcherSystemDisabled) {
    const shifts = storage.get<DispatcherShift[]>(KEYS.DISPATCHER_SHIFTS, []);
    const activeShifts = shifts.filter(s => s.isActive);
    activeShifts.forEach(shift => {
      endDispatcherShift(shift.dispatcherId);
    });
  }
  
  if (restrictions.mdtSystemDisabled !== undefined) {
    const users = getAllUsers();
    
    if (restrictions.mdtSystemDisabled) {
      const shifts = storage.get<DispatcherShift[]>(KEYS.DISPATCHER_SHIFTS, []);
      const activeShifts = shifts.filter(s => s.isActive);
      activeShifts.forEach(shift => {
        endDispatcherShift(shift.dispatcherId);
      });
      
      const updatedUsers = users.map(u => {
        if (u.role === 'dispatcher' && !u.frozen) {
          return {
            ...u,
            frozen: true,
            frozenBy: 'system',
            frozenAt: new Date().toISOString(),
            frozenBySystem: true
          };
        }
        return u;
      });
      
      storage.set(KEYS.USERS, updatedUsers);
      syncManager.notify('users_updated');
      
      const calls = getCalls();
      const activeCalls = calls.filter(c => c.status !== 'completed');
      activeCalls.forEach(call => {
        updateCallStatus(call.id, 'completed');
      });
      
      const crews = getCrews();
      const crewsWithAlerts = crews.filter(c => c.panicActive || c.signal100Active);
      crewsWithAlerts.forEach(crew => {
        if (crew.panicActive) {
          resetPanic(crew.id, 'system');
        }
        if (crew.signal100Active) {
          const updatedCrews = getCrews().map(c => 
            c.id === crew.id
              ? { ...c, signal100Active: false, signal100TriggeredAt: undefined, signal100TriggeredBy: undefined }
              : c
          );
          storage.set(KEYS.CREWS, updatedCrews);
        }
      });
      
      const signal100 = getActiveSignal100();
      if (signal100) {
        resetSignal100('system');
      }
      
      syncManager.notify('crews_updated');
      syncManager.notify('calls_updated');
    } else {
      const updatedUsers = users.map(u => {
        if (u.role === 'dispatcher' && u.frozenBySystem) {
          return {
            ...u,
            frozen: false,
            frozenBy: undefined,
            frozenAt: undefined,
            frozenBySystem: undefined
          };
        }
        return u;
      });
      
      storage.set(KEYS.USERS, updatedUsers);
      syncManager.notify('users_updated');
    }
  }
};

export const isDispatcherSystemDisabled = (): boolean => {
  return getSystemRestrictions().dispatcherSystemDisabled;
};

export const isSignal100Disabled = (): boolean => {
  return getSystemRestrictions().signal100Disabled;
};

export const isPanicButtonDisabled = (): boolean => {
  return getSystemRestrictions().panicButtonDisabled;
};

export const isMdtSystemDisabled = (): boolean => {
  return getSystemRestrictions().mdtSystemDisabled;
};

export const isSurvSystemEnabled = (): boolean => {
  return getSystemRestrictions().survSystemEnabled;
};

// ============================================================================
// SURV SYSTEM API (SHIFT MANAGEMENT)
// ============================================================================

export const getUserShiftSession = (userId: string): ShiftSession | null => {
  const sessions = storage.get<ShiftSession[]>(KEYS.SHIFT_SESSIONS, []);
  return sessions.find(s => s.userId === userId) || null;
};

export const startShift = (userId: string): void => {
  const sessions = storage.get<ShiftSession[]>(KEYS.SHIFT_SESSIONS, []);
  const existingIndex = sessions.findIndex(s => s.userId === userId);
  
  const now = new Date().toISOString();
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = {
      ...sessions[existingIndex],
      status: 'on-shift',
      currentSessionStart: now,
      lastHeartbeat: now
    };
  } else {
    const newSession: ShiftSession = {
      id: `SHIFT-${Date.now()}-${userId}`,
      userId,
      status: 'on-shift',
      startTime: now,
      totalWorkTime: 0,
      totalBreakTime: 0,
      currentSessionStart: now,
      lastHeartbeat: now
    };
    sessions.push(newSession);
  }
  
  storage.set(KEYS.SHIFT_SESSIONS, sessions);
  syncManager.notify('shift_sessions_updated');
};

export const startBreak = (userId: string): void => {
  const sessions = storage.get<ShiftSession[]>(KEYS.SHIFT_SESSIONS, []);
  const session = sessions.find(s => s.userId === userId);
  
  if (!session) return;
  
  const now = new Date().toISOString();
  
  if (session.status === 'on-shift' && session.currentSessionStart) {
    const workDuration = new Date(now).getTime() - new Date(session.currentSessionStart).getTime();
    session.totalWorkTime += workDuration;
    
    saveSessionToStatistics(userId, session, 'work', session.currentSessionStart, now, workDuration);
  }
  
  session.status = 'on-break';
  session.currentSessionStart = now;
  session.lastHeartbeat = now;
  
  storage.set(KEYS.SHIFT_SESSIONS, sessions);
  syncManager.notify('shift_sessions_updated');
};

export const resumeShift = (userId: string): void => {
  const sessions = storage.get<ShiftSession[]>(KEYS.SHIFT_SESSIONS, []);
  const session = sessions.find(s => s.userId === userId);
  
  if (!session) return;
  
  const now = new Date().toISOString();
  
  if (session.status === 'on-break' && session.currentSessionStart) {
    const breakDuration = new Date(now).getTime() - new Date(session.currentSessionStart).getTime();
    session.totalBreakTime += breakDuration;
    
    saveSessionToStatistics(userId, session, 'break', session.currentSessionStart, now, breakDuration);
  }
  
  session.status = 'on-shift';
  session.currentSessionStart = now;
  session.lastHeartbeat = now;
  
  storage.set(KEYS.SHIFT_SESSIONS, sessions);
  syncManager.notify('shift_sessions_updated');
};

export const endShift = (userId: string): void => {
  const sessions = storage.get<ShiftSession[]>(KEYS.SHIFT_SESSIONS, []);
  const session = sessions.find(s => s.userId === userId);
  
  if (!session) return;
  
  const now = new Date().toISOString();
  
  if (session.status === 'on-shift' && session.currentSessionStart) {
    const workDuration = new Date(now).getTime() - new Date(session.currentSessionStart).getTime();
    session.totalWorkTime += workDuration;
    saveSessionToStatistics(userId, session, 'work', session.currentSessionStart, now, workDuration);
  } else if (session.status === 'on-break' && session.currentSessionStart) {
    const breakDuration = new Date(now).getTime() - new Date(session.currentSessionStart).getTime();
    session.totalBreakTime += breakDuration;
    saveSessionToStatistics(userId, session, 'break', session.currentSessionStart, now, breakDuration);
  }
  
  session.status = 'off-shift';
  session.endTime = now;
  session.currentSessionStart = undefined;
  session.lastHeartbeat = now;
  
  const updatedSessions = sessions.filter(s => s.userId !== userId);
  storage.set(KEYS.SHIFT_SESSIONS, updatedSessions);
  syncManager.notify('shift_sessions_updated');
};

export const updateShiftHeartbeat = (userId: string): void => {
  const sessions = storage.get<ShiftSession[]>(KEYS.SHIFT_SESSIONS, []);
  const session = sessions.find(s => s.userId === userId);
  
  if (!session || session.status === 'off-shift') return;
  
  session.lastHeartbeat = new Date().toISOString();
  storage.set(KEYS.SHIFT_SESSIONS, sessions);
};

export const checkInactiveSessions = (): void => {
  const sessions = storage.get<ShiftSession[]>(KEYS.SHIFT_SESSIONS, []);
  const now = Date.now();
  const timeout = 10 * 60 * 1000;
  
  sessions.forEach(session => {
    if (session.status !== 'off-shift') {
      const lastHeartbeat = new Date(session.lastHeartbeat).getTime();
      if (now - lastHeartbeat > timeout) {
        endShift(session.userId);
      }
    }
  });
};

const saveSessionToStatistics = (userId: string, session: ShiftSession, status: 'work' | 'break', startTime: string, endTime: string, duration: number): void => {
  const allStats = storage.get<ShiftStatistics[]>(KEYS.SHIFT_STATISTICS, []);
  const date = new Date(startTime).toISOString().split('T')[0];
  
  const existingStatIndex = allStats.findIndex(s => s.userId === userId && s.date === date);
  
  const sessionRecord = {
    status,
    startTime,
    endTime,
    duration
  };
  
  if (existingStatIndex >= 0) {
    if (status === 'work') {
      allStats[existingStatIndex].totalWorkTime += duration;
    } else {
      allStats[existingStatIndex].totalBreakTime += duration;
    }
    allStats[existingStatIndex].sessions.push(sessionRecord);
  } else {
    const newStat: ShiftStatistics = {
      userId,
      date,
      totalWorkTime: status === 'work' ? duration : 0,
      totalBreakTime: status === 'break' ? duration : 0,
      sessions: [sessionRecord]
    };
    allStats.push(newStat);
  }
  
  storage.set(KEYS.SHIFT_STATISTICS, allStats);
  syncManager.notify('shift_statistics_updated');
};

const saveShiftStatistics = (session: ShiftSession): void => {
  const allStats = storage.get<ShiftStatistics[]>(KEYS.SHIFT_STATISTICS, []);
  const date = new Date(session.startTime).toISOString().split('T')[0];
  
  const existingStatIndex = allStats.findIndex(s => s.userId === session.userId && s.date === date);
  
  const workSessions: Array<{ status: 'work' | 'break'; startTime: string; endTime: string; duration: number }> = [];
  
  if (session.totalWorkTime > 0) {
    workSessions.push({
      status: 'work',
      startTime: session.startTime,
      endTime: session.endTime || new Date().toISOString(),
      duration: session.totalWorkTime
    });
  }
  
  if (existingStatIndex >= 0) {
    allStats[existingStatIndex].totalWorkTime += session.totalWorkTime;
    allStats[existingStatIndex].totalBreakTime += session.totalBreakTime;
    allStats[existingStatIndex].sessions.push(...workSessions);
  } else {
    const newStat: ShiftStatistics = {
      userId: session.userId,
      date,
      totalWorkTime: session.totalWorkTime,
      totalBreakTime: session.totalBreakTime,
      sessions: workSessions
    };
    allStats.push(newStat);
  }
  
  storage.set(KEYS.SHIFT_STATISTICS, allStats);
  syncManager.notify('shift_statistics_updated');
};

export const getShiftStatistics = (userId: string, date: string): ShiftStatistics | null => {
  const allStats = storage.get<ShiftStatistics[]>(KEYS.SHIFT_STATISTICS, []);
  return allStats.find(s => s.userId === userId && s.date === date) || null;
};

export const getUserShiftStatistics = (userId: string, startDate: string, endDate: string): ShiftStatistics[] => {
  const allStats = storage.get<ShiftStatistics[]>(KEYS.SHIFT_STATISTICS, []);
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return allStats.filter(s => {
    if (s.userId !== userId) return false;
    const statDate = new Date(s.date).getTime();
    return statDate >= start && statDate <= end;
  });
};

export const getAllUsersShiftStatistics = (date: string): ShiftStatistics[] => {
  const allStats = storage.get<ShiftStatistics[]>(KEYS.SHIFT_STATISTICS, []);
  return allStats.filter(s => s.date === date);
};

// ============================================================================
// TESTING SYSTEM API
// ============================================================================

export const getAllTests = (): Test[] => {
  const tests = storage.get<Test[]>(KEYS.TESTS, []);
  return tests.map(test => ({
    ...test,
    showAnswers: test.showAnswers || 'after-completion'
  }));
};

export const getTestById = (testId: string): Test | null => {
  const tests = getAllTests();
  const test = tests.find(t => t.id === testId);
  if (!test) return null;
  return {
    ...test,
    showAnswers: test.showAnswers || 'after-completion'
  };
};

export const createTest = (test: Omit<Test, 'id' | 'createdAt'>, creatorId: string): Test => {
  const tests = getAllTests();
  const newTest: Test = {
    ...test,
    id: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdBy: creatorId,
    createdAt: new Date().toISOString()
  };
  storage.set(KEYS.TESTS, [...tests, newTest]);
  syncManager.notify('tests_updated');
  return newTest;
};

export const duplicateTest = (testId: string, creatorId: string): Test | null => {
  const tests = getAllTests();
  const originalTest = tests.find(t => t.id === testId);
  if (!originalTest) return null;

  const newTest: Test = {
    ...originalTest,
    id: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `${originalTest.title} (копия)`,
    createdBy: creatorId,
    createdAt: new Date().toISOString(),
    questions: originalTest.questions.map(q => ({
      ...q,
      id: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))
  };

  storage.set(KEYS.TESTS, [...tests, newTest]);
  syncManager.notify('tests_updated');
  return newTest;
};

export const updateTest = (testId: string, updates: Partial<Omit<Test, 'id' | 'createdBy' | 'createdAt'>>): boolean => {
  const tests = getAllTests();
  const testIndex = tests.findIndex(t => t.id === testId);
  if (testIndex === -1) return false;
  
  tests[testIndex] = { ...tests[testIndex], ...updates };
  storage.set(KEYS.TESTS, tests);
  syncManager.notify('tests_updated');
  return true;
};

export const updateTestQuestion = (testId: string, questionId: string, updates: Partial<Question>): boolean => {
  const tests = getAllTests();
  const testIndex = tests.findIndex(t => t.id === testId);
  if (testIndex === -1) return false;
  
  const questionIndex = tests[testIndex].questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) return false;
  
  tests[testIndex].questions[questionIndex] = {
    ...tests[testIndex].questions[questionIndex],
    ...updates
  };
  storage.set(KEYS.TESTS, tests);
  syncManager.notify('tests_updated');
  return true;
};

export const deleteTestQuestion = (testId: string, questionId: string): boolean => {
  const tests = getAllTests();
  const testIndex = tests.findIndex(t => t.id === testId);
  if (testIndex === -1) return false;
  
  tests[testIndex].questions = tests[testIndex].questions.filter(q => q.id !== questionId);
  storage.set(KEYS.TESTS, tests);
  syncManager.notify('tests_updated');
  return true;
};

export const deleteTest = (testId: string): boolean => {
  const tests = getAllTests();
  const filteredTests = tests.filter(t => t.id !== testId);
  storage.set(KEYS.TESTS, filteredTests);
  
  const assignments = getAllTestAssignments();
  const filteredAssignments = assignments.filter(a => a.testId !== testId);
  storage.set(KEYS.TEST_ASSIGNMENTS, filteredAssignments);
  
  syncManager.notify('tests_updated');
  syncManager.notify('test_assignments_updated');
  return true;
};

export const getAllTestAssignments = (): TestAssignment[] => {
  return storage.get<TestAssignment[]>(KEYS.TEST_ASSIGNMENTS, []);
};

export const getTestAssignmentById = (assignmentId: string): TestAssignment | null => {
  const assignments = getAllTestAssignments();
  return assignments.find(a => a.id === assignmentId) || null;
};

export const getUserTestAssignments = (userId: string): TestAssignment[] => {
  const assignments = getAllTestAssignments();
  return assignments.filter(a => a.userId === userId);
};

export const assignTest = (testId: string, userId: string, assignedBy: string, dueDate?: string): TestAssignment => {
  const assignments = getAllTestAssignments();
  const newAssignment: TestAssignment = {
    id: `ASSIGN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    testId,
    userId,
    assignedBy,
    assignedAt: new Date().toISOString(),
    dueDate,
    status: 'pending'
  };
  storage.set(KEYS.TEST_ASSIGNMENTS, [...assignments, newAssignment]);
  syncManager.notify('test_assignments_updated');
  return newAssignment;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const startTestAttempt = (assignmentId: string): boolean => {
  const assignments = getAllTestAssignments();
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment || assignment.status !== 'pending') return false;
  
  const test = getTestById(assignment.testId);
  if (!test) return false;

  // Рандомизация вопросов (если включена)
  let selectedQuestions = [...test.questions];
  
  // Банк вопросов: выбираем случайное подмножество
  if (test.questionBankSize && test.questionBankSize < selectedQuestions.length) {
    selectedQuestions = shuffleArray(selectedQuestions).slice(0, test.questionBankSize);
  }
  
  // Рандомизация порядка вопросов
  let questionOrder = selectedQuestions.map(q => q.id);
  if (test.randomizeQuestions) {
    questionOrder = shuffleArray(questionOrder);
  }
  
  // Рандомизация вариантов ответов для каждого вопроса
  const optionsOrder: Record<string, number[]> = {};
  if (test.randomizeOptions) {
    selectedQuestions.forEach(q => {
      if (q.type !== 'text' && q.options) {
        const indices = q.options.map((_, i) => i);
        optionsOrder[q.id] = shuffleArray(indices);
      }
    });
  }
  
  assignment.status = 'in-progress';
  assignment.startedAt = new Date().toISOString();
  assignment.selectedQuestionIds = selectedQuestions.map(q => q.id);
  assignment.questionOrder = questionOrder;
  assignment.optionsOrder = Object.keys(optionsOrder).length > 0 ? optionsOrder : undefined;
  
  storage.set(KEYS.TEST_ASSIGNMENTS, assignments);
  syncManager.notify('test_assignments_updated');
  return true;
};

export const submitTestAnswers = (assignmentId: string, answers: TestAnswer[]): boolean => {
  const assignments = getAllTestAssignments();
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment || assignment.status !== 'in-progress') return false;
  
  const test = getTestById(assignment.testId);
  if (!test) return false;
  
  let totalPoints = 0;
  let earnedPoints = 0;
  let requiresManualReview = false;
  
  const processedAnswers = answers.map(answer => {
    const question = test.questions.find(q => q.id === answer.questionId);
    if (!question) return answer;
    
    totalPoints += question.points;
    
    if (question.type === 'text') {
      requiresManualReview = true;
      return answer;
    }
    
    if (question.type === 'single' || question.type === 'multiple') {
      const correctAnswers = question.correctAnswers || [];
      
      if (correctAnswers.length === 0) {
        requiresManualReview = true;
        return answer;
      }
      
      const selectedOptions = answer.selectedOptions || [];
      
      const isCorrect = correctAnswers.length === selectedOptions.length &&
        correctAnswers.every(ca => selectedOptions.includes(ca));
      
      if (isCorrect) {
        earnedPoints += question.points;
      }
      
      return { ...answer, isCorrect };
    }
    
    return answer;
  });
  
  assignment.answers = processedAnswers;
  assignment.completedAt = new Date().toISOString();
  
  if (requiresManualReview) {
    assignment.status = 'completed';
  } else {
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    assignment.score = score;
    assignment.status = score >= test.passingScore ? 'passed' : 'failed';
  }
  
  storage.set(KEYS.TEST_ASSIGNMENTS, assignments);
  syncManager.notify('test_assignments_updated');
  return true;
};

export const reviewTestManually = (assignmentId: string, score: number, reviewerId: string): boolean => {
  const assignments = getAllTestAssignments();
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment || assignment.status !== 'completed') return false;
  
  const test = getTestById(assignment.testId);
  if (!test) return false;
  
  assignment.score = score;
  assignment.status = score >= test.passingScore ? 'passed' : 'failed';
  assignment.reviewedBy = reviewerId;
  assignment.reviewedAt = new Date().toISOString();
  
  storage.set(KEYS.TEST_ASSIGNMENTS, assignments);
  syncManager.notify('test_assignments_updated');
  return true;
};

export const deleteTestAssignment = (assignmentId: string): boolean => {
  const assignments = getAllTestAssignments();
  const filteredAssignments = assignments.filter(a => a.id !== assignmentId);
  storage.set(KEYS.TEST_ASSIGNMENTS, filteredAssignments);
  syncManager.notify('test_assignments_updated');
  return true;
};

export const getTestStatistics = (testId: string) => {
  const assignments = getAllTestAssignments().filter(a => a.testId === testId);
  
  return {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    inProgress: assignments.filter(a => a.status === 'in-progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    passed: assignments.filter(a => a.status === 'passed').length,
    failed: assignments.filter(a => a.status === 'failed').length,
    averageScore: assignments.filter(a => a.score !== undefined).reduce((acc, a) => acc + (a.score || 0), 0) / 
      (assignments.filter(a => a.score !== undefined).length || 1)
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