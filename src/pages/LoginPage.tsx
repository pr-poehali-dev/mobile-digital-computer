import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPageComponent from '@/components/LoginPage';
import RegisterPage from '@/components/RegisterPage';
import { getUserSession, type User } from '@/lib/auth';
import { addOnlineUser, addActivityLog } from '@/lib/store';

const LoginPage = () => {
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserSession();
    if (user && typeof user.id === 'string') {
      navigate(user.role === 'employee' ? '/tests' : '/mdc');
    }
  }, [navigate]);

  const handleLogin = (user: User) => {
    addOnlineUser(user);
    addActivityLog({
      type: 'crew_status',
      userId: user.id,
      userName: user.fullName,
      description: `Вход в систему`,
      details: `Роль: ${user.role}`
    });
    
    if (user.role === 'employee') {
      navigate('/tests');
    } else {
      navigate('/mdc');
    }
  };

  if (showRegister) {
    return <RegisterPage onBackToLogin={() => setShowRegister(false)} />;
  }

  return <LoginPageComponent onLogin={handleLogin} onRegister={() => setShowRegister(true)} />;
};

export default LoginPage;
