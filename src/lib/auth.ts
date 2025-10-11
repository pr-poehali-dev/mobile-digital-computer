export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
}

const USERS_DB = [
  {
    id: 1,
    username: 'manager',
    password: 'Manager2024!',
    fullName: 'Петров Петр Петрович',
    role: 'manager',
    email: 'manager@mdc.system',
    phone: '+7 (999) 000-11-22'
  },
  {
    id: 2,
    username: 'dispatcher',
    password: 'Disp2024!',
    fullName: 'Иванов Иван Иванович',
    role: 'dispatcher',
    email: 'dispatcher@mdc.system',
    phone: '+7 (999) 123-45-67'
  }
];

export const authenticate = async (username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const usersData = localStorage.getItem('mdc_users');
  const users = usersData ? JSON.parse(usersData) : USERS_DB;
  
  const userWithPassword = users.find((u: any) => u.username === username && u.password === password);

  if (!userWithPassword) {
    return {
      success: false,
      error: 'Неверный логин или пароль'
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