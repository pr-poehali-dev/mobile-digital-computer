export interface User {
  id: string;
  fullName: string;
  role: 'manager' | 'dispatcher' | 'supervisor' | 'employee';
  email: string;
  phone: string;
}

const USERS_DB = [
  {
    id: '10001',
    password: 'Admin2024!',
    fullName: 'Петров Петр Петрович',
    role: 'manager',
    email: 'manager@mdc.system',
    phone: '+7 (999) 000-11-22'
  },
  {
    id: '10002',
    password: 'Disp2024!',
    fullName: 'Иванов Иван Иванович',
    role: 'dispatcher',
    email: 'dispatcher@mdc.system',
    phone: '+7 (999) 123-45-67'
  },
  {
    id: '10003',
    password: 'Super2024!',
    fullName: 'Сидоров Сергей Сергеевич',
    role: 'supervisor',
    email: 'supervisor@mdc.system',
    phone: '+7 (999) 222-33-44'
  },
  {
    id: '10004',
    password: 'Emp2024!',
    fullName: 'Васильев Василий Васильевич',
    role: 'employee',
    email: 'employee@mdc.system',
    phone: '+7 (999) 333-44-55'
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