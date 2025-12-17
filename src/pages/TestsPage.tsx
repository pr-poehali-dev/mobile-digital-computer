import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import MyTestsView from '@/components/MyTestsView';
import { getUserSession, clearUserSession } from '@/lib/auth';

const TestsPage = () => {
  const navigate = useNavigate();
  const currentUser = getUserSession();

  useEffect(() => {
    if (!currentUser || typeof currentUser.id !== 'string') {
      clearUserSession();
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="ClipboardList" size={24} className="text-primary" />
              <div>
                <h1 className="text-xl font-bold">Мои тесты</h1>
                <p className="text-sm text-muted-foreground">{currentUser.fullName}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/mdc')}>
              <Icon name="Home" size={16} className="mr-2" />
              На главную
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <MyTestsView currentUser={currentUser} />
      </main>
    </div>
  );
};

export default TestsPage;
