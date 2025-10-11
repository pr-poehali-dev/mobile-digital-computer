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

  const user = USERS_DB.find(u => u.username === username && u.password === password);

  if (!user) {
    return {
      success: false,
      error: 'Неверный логин или пароль'
    };
  }

  const { password: _, ...userData } = user;
  
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
