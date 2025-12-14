export interface User {
  id: string;
  fullName: string;
  role: 'manager' | 'dispatcher' | 'supervisor' | 'employee';
  email: string;
  frozen?: boolean;
  frozenBy?: string;
  frozenAt?: string;
  frozenBySystem?: boolean;
  pendingActivation?: boolean;
  registeredAt?: string;
}

const USERS_DB = [
  {
    id: '10001',
    password: 'Admin2024!',
    fullName: 'Петров Петр Петрович',
    role: 'manager',
    email: 'manager@mdc.system'
  },
  {
    id: '10002',
    password: 'Disp2024!',
    fullName: 'Иванов Иван Иванович',
    role: 'dispatcher',
    email: 'dispatcher@mdc.system'
  },
  {
    id: '10003',
    password: 'Super2024!',
    fullName: 'Сидоров Сергей Сергеевич',
    role: 'supervisor',
    email: 'supervisor@mdc.system'
  },
  {
    id: '10004',
    password: 'Emp2024!',
    fullName: 'Васильев Василий Васильевич',
    role: 'employee',
    email: 'employee@mdc.system'
  }
];

const initializeUsers = () => {
  const existingUsers = localStorage.getItem('mdc_users');
  if (!existingUsers) {
    localStorage.setItem('mdc_users', JSON.stringify(USERS_DB));
  } else {
    try {
      const users = JSON.parse(existingUsers);
      const needsMigration = users.some((u: any) => typeof u.id === 'number');
      if (needsMigration) {
        localStorage.setItem('mdc_users', JSON.stringify(USERS_DB));
        localStorage.removeItem('mdc_auth');
        localStorage.removeItem('mdc_user');
      }
    } catch {
      localStorage.setItem('mdc_users', JSON.stringify(USERS_DB));
    }
  }
};

initializeUsers();

export const authenticate = async (userId: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const usersData = localStorage.getItem('mdc_users');
  const users = usersData ? JSON.parse(usersData) : USERS_DB;
  
  const userWithPassword = users.find((u: any) => u.id === userId && u.password === password);

  if (!userWithPassword) {
    return {
      success: false,
      error: 'Неверный ID или пароль'
    };
  }

  const { password: _, ...userData } = userWithPassword;
  
  if (userData.pendingActivation) {
    return {
      success: false,
      error: 'Ваш аккаунт ожидает активации менеджером. Пожалуйста, подождите.'
    };
  }\n  
  if (userData.frozen) {
    if (userData.frozenBySystem && userData.role === 'dispatcher') {
      return {
        success: false,
        error: 'Диспетчерская система временно отключена менеджером. Доступ ограничен.'
      };
    }
    return {
      success: false,
      error: 'Ваш аккаунт заморожен. Обратитесь к менеджеру или руководителю.'
    };
  }
  
  const lockdownData = localStorage.getItem('mdc_system_lockdown');
  if (lockdownData) {
    try {
      const lockdown = JSON.parse(lockdownData);
      if (lockdown.active && userData.role !== 'manager') {
        return {
          success: false,
          error: 'Доступ временно ограничен. Обратитесь к менеджеру.'
        };
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  return {
    success: true,
    user: userData
  };
};

export const saveUserSession = (user: User) => {
  localStorage.setItem('mdc_auth', 'true');
  localStorage.setItem('mdc_user', JSON.stringify(user));
};

export const getUserSession = (): User | null => {
  const authStatus = localStorage.getItem('mdc_auth');
  const userData = localStorage.getItem('mdc_user');
  
  if (authStatus === 'true' && userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  
  return null;
};

export const clearUserSession = () => {
  localStorage.removeItem('mdc_auth');
  localStorage.removeItem('mdc_user');
};

interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
}

export const register = async (data: RegistrationData): Promise<{ success: boolean; error?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const usersData = localStorage.getItem('mdc_users');
  const users = usersData ? JSON.parse(usersData) : USERS_DB;

  if (users.find((u: any) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return {
      success: false,
      error: 'Пользователь с такой электронной почтой уже существует'
    };
  }

  const maxId = Math.max(...users.map((u: any) => parseInt(u.id)));
  const newId = (maxId + 1).toString();

  const newUser = {
    id: newId,
    password: data.password,
    fullName: data.fullName,
    email: data.email,
    role: 'employee' as const,
    pendingActivation: true,
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem('mdc_users', JSON.stringify(users));

  return { success: true };
};

export const getPendingUsers = (): Array<User & { id: string }> => {
  const usersData = localStorage.getItem('mdc_users');
  const users = usersData ? JSON.parse(usersData) : [];
  
  return users
    .filter((u: any) => u.pendingActivation)
    .map(({ password, ...user }: any) => user);
};

export const activateUser = (userId: string, role: User['role']): boolean => {
  const usersData = localStorage.getItem('mdc_users');
  const users = usersData ? JSON.parse(usersData) : [];
  
  const userIndex = users.findIndex((u: any) => u.id === userId);
  if (userIndex === -1) return false;
  
  users[userIndex].pendingActivation = false;
  users[userIndex].role = role;
  
  localStorage.setItem('mdc_users', JSON.stringify(users));
  return true;
};

export const rejectRegistration = (userId: string): boolean => {
  const usersData = localStorage.getItem('mdc_users');
  const users = usersData ? JSON.parse(usersData) : [];
  
  const filteredUsers = users.filter((u: any) => u.id !== userId);
  localStorage.setItem('mdc_users', JSON.stringify(filteredUsers));
  
  return true;
};