import bcrypt from 'bcryptjs';

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

interface UserWithPassword {
  id: string;
  passwordHash: string;
  fullName: string;
  role: User['role'];
  email: string;
  frozen?: boolean;
  frozenBy?: string;
  frozenAt?: string;
  frozenBySystem?: boolean;
  pendingActivation?: boolean;
  registeredAt?: string;
}

const USERS_DB: UserWithPassword[] = [
  {
    id: '10001',
    passwordHash: bcrypt.hashSync('Admin2024!', 10),
    fullName: 'Петров Петр Петрович',
    role: 'manager',
    email: 'manager@mdc.system'
  },
  {
    id: '10002',
    passwordHash: bcrypt.hashSync('Disp2024!', 10),
    fullName: 'Иванов Иван Иванович',
    role: 'dispatcher',
    email: 'dispatcher@mdc.system'
  },
  {
    id: '10003',
    passwordHash: bcrypt.hashSync('Super2024!', 10),
    fullName: 'Сидоров Сергей Сергеевич',
    role: 'supervisor',
    email: 'supervisor@mdc.system'
  },
  {
    id: '10004',
    passwordHash: bcrypt.hashSync('Emp2024!', 10),
    fullName: 'Васильев Василий Васильевич',
    role: 'employee',
    email: 'employee@mdc.system'
  }
];

const STORAGE_KEYS = {
  USERS_DATA: 'mdc_users_data',
  PASSWORDS: 'mdc_passwords',
  AUTH: 'mdc_auth',
  USER: 'mdc_user',
  LOCKDOWN: 'mdc_system_lockdown'
} as const;

const migrateOldData = () => {
  const oldUsers = localStorage.getItem('mdc_users');
  if (oldUsers) {
    try {
      const users = JSON.parse(oldUsers);
      if (users.some((u: any) => u.password && !u.passwordHash)) {
        console.log('[Auth] Migrating old password format to hashed format');
        const migratedUsers = users.map((u: any) => {
          if (u.password && !u.passwordHash) {
            const { password, ...rest } = u;
            return {
              ...rest,
              passwordHash: bcrypt.hashSync(password, 10)
            };
          }
          return u;
        });
        localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(migratedUsers));
        
        const usersWithoutPasswords = migratedUsers.map(({ passwordHash, ...user }: any) => user);
        localStorage.setItem(STORAGE_KEYS.USERS_DATA, JSON.stringify(usersWithoutPasswords));
        
        localStorage.removeItem('mdc_users');
      }
    } catch (e) {
      console.error('[Auth] Migration error:', e);
    }
  }
};

const initializeUsers = () => {
  migrateOldData();
  
  const existingPasswords = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS_DATA);
  
  if (!existingPasswords || !existingUsers) {
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(USERS_DB));
    
    const usersWithoutPasswords = USERS_DB.map(({ passwordHash, ...user }) => user);
    localStorage.setItem(STORAGE_KEYS.USERS_DATA, JSON.stringify(usersWithoutPasswords));
  }
};

initializeUsers();

const getUsersWithPasswords = (): UserWithPassword[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
  return data ? JSON.parse(data) : USERS_DB;
};

const saveUsersWithPasswords = (users: UserWithPassword[]): void => {
  localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(users));
  
  const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);
  localStorage.setItem(STORAGE_KEYS.USERS_DATA, JSON.stringify(usersWithoutPasswords));
};

export const authenticate = async (userIdOrEmail: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const users = getUsersWithPasswords();
  
  const userWithPassword = users.find((u) => 
    u.id === userIdOrEmail || u.email.toLowerCase() === userIdOrEmail.toLowerCase()
  );

  if (!userWithPassword) {
    return {
      success: false,
      error: 'Неверный ID/Email или пароль'
    };
  }

  const passwordMatch = await bcrypt.compare(password, userWithPassword.passwordHash);
  
  if (!passwordMatch) {
    return {
      success: false,
      error: 'Неверный ID/Email или пароль'
    };
  }

  const { passwordHash: _, ...userData } = userWithPassword;
  
  if (userData.pendingActivation) {
    return {
      success: false,
      error: 'Ваш аккаунт ожидает активации менеджером. Пожалуйста, подождите.'
    };
  }
  
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
  
  const lockdownData = localStorage.getItem(STORAGE_KEYS.LOCKDOWN);
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
  localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUserSession = (): User | null => {
  const authStatus = localStorage.getItem(STORAGE_KEYS.AUTH);
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  
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
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
}

export const register = async (data: RegistrationData): Promise<{ success: boolean; error?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const users = getUsersWithPasswords();

  if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return {
      success: false,
      error: 'Пользователь с такой электронной почтой уже существует'
    };
  }

  const maxId = Math.max(...users.map((u) => parseInt(u.id)));
  const newId = (maxId + 1).toString();

  const passwordHash = await bcrypt.hash(data.password, 10);

  const newUser: UserWithPassword = {
    id: newId,
    passwordHash,
    fullName: data.fullName,
    email: data.email,
    role: 'employee',
    pendingActivation: true,
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsersWithPasswords(users);

  return { success: true };
};

export const getPendingUsers = (): Array<User & { id: string }> => {
  const users = getUsersWithPasswords();
  
  return users
    .filter((u) => u.pendingActivation)
    .map(({ passwordHash, ...user }) => user);
};

export const activateUser = (userId: string, role: User['role']): boolean => {
  const users = getUsersWithPasswords();
  
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return false;
  
  users[userIndex].pendingActivation = false;
  users[userIndex].role = role;
  
  saveUsersWithPasswords(users);
  return true;
};

export const rejectRegistration = (userId: string): boolean => {
  const users = getUsersWithPasswords();
  
  const filteredUsers = users.filter((u) => u.id !== userId);
  saveUsersWithPasswords(filteredUsers);
  
  return true;
};

export const changeUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
  const users = getUsersWithPasswords();
  
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return false;
  
  const passwordHash = await bcrypt.hash(newPassword, 10);
  users[userIndex].passwordHash = passwordHash;
  
  saveUsersWithPasswords(users);
  return true;
};
