import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ReaderHomeView } from './components/ReaderHomeView';
import { BooksView } from './components/BooksView';
import { UsersView } from './components/UsersView';
import { LoansView } from './components/LoansView';
import { AccountsView } from './components/AccountsView';
import { CommunityView } from './components/CommunityView';
import { PerfilView } from './components/PerfilView';
import { WelcomeView } from './components/WelcomeView';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { TutorialModal } from './components/TutorialModal';
import { AIAssistant } from './components/AIAssistant';
import { Moon, Sun } from 'lucide-react';
import type { CurrentUser } from './types';
import { getStoredUser, setStoredUser, setToken } from './api';
import './App.css';
import './styles/plopp-theme.css';

const rolePermissions: Record<CurrentUser['rol'], string[]> = {
  admin: ['dashboard', 'books', 'users', 'loans', 'accounts'],
  bibliotecario: ['dashboard', 'books', 'users', 'loans'],
  usuario: ['home', 'books', 'loans', 'community', 'profile'],
};

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => getStoredUser<CurrentUser>());
  const [currentView, setCurrentView] = useState(() => {
    const stored = getStoredUser<CurrentUser>();
    return stored?.rol === 'usuario' ? 'home' : 'dashboard';
  });
  const [authView, setAuthView] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('bf_theme');
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'light';
  });

  useEffect(() => {
    if (currentUser?.token) {
      setToken(currentUser.token);
    } else if (currentUser?.rol === 'admin') {
      setStoredUser(null);
      setCurrentUser(null);
      setToken(null);
    }
  }, [currentUser]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (isMobileViewport && currentUser && currentUser.rol !== 'usuario') {
      setToken(null);
      setStoredUser(null);
      setCurrentUser(null);
      setCurrentView('dashboard');
      setAuthView('login');
      window.alert('En dispositivos móviles solo está disponible el acceso de usuario lector.');
    }
  }, [isMobileViewport, currentUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bf_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!currentUser) return;
    const seenKey = `plopp_tutorial_seen_${currentUser.rol}`;
    if (!localStorage.getItem(seenKey)) {
      setShowTutorial(true);
    }
  }, [currentUser?.rol]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const startSession = (user: CurrentUser) => {
    if (isMobileViewport && user.rol !== 'usuario') {
      setToken(null);
      setStoredUser(null);
      setAuthView('login');
      window.alert('En dispositivos móviles solo está disponible el acceso de usuario lector.');
      return;
    }
    setToken(user.token ?? null);
    setStoredUser(user);
    setCurrentUser(user);
    setCurrentView(user.rol === 'usuario' ? 'home' : 'dashboard');
    setSidebarOpen(false);
    setAuthView('welcome');
  };

  const renderView = () => {
    const userRole = currentUser?.rol ?? 'usuario';

    switch (currentView) {
      case 'home':
        return userRole === 'usuario'
          ? <ReaderHomeView currentUser={currentUser} onNavigate={handleNavChange} />
          : <DashboardView />;
      case 'dashboard':
        return userRole === 'usuario' ? <BooksView userRole={userRole} currentUser={currentUser} /> : <DashboardView />;
      case 'books':
        return <BooksView userRole={userRole} currentUser={currentUser} />;
      case 'users':
        return userRole === 'usuario' ? <BooksView userRole={userRole} currentUser={currentUser} /> : <UsersView />;
      case 'loans':
        return <LoansView currentUser={currentUser} />;
      case 'accounts':
        return userRole === 'admin' ? <AccountsView userRole={userRole} /> : <BooksView userRole={userRole} currentUser={currentUser} />;
      case 'community':
        return userRole === 'admin' || userRole === 'bibliotecario'
          ? <DashboardView />
          : <CommunityView currentUser={currentUser} />;
      case 'profile':
        return userRole === 'admin' || userRole === 'bibliotecario'
          ? <DashboardView />
          : <PerfilView currentUser={currentUser} />;
      default:
        return <BooksView userRole={userRole} currentUser={currentUser} />;
    }
  };

  const handleNavChange = (view: string) => {
    const allowedViews = currentUser ? rolePermissions[currentUser.rol] : ['dashboard'];
    const nextView = allowedViews.includes(view) ? view : 'dashboard';
    setCurrentView(nextView);
    setSidebarOpen(false);
  };

  const handleLogin = (user: CurrentUser) => {
    startSession(user);
  };

  const handleRegistered = (user: CurrentUser) => {
    startSession(user);
  };

  const handleLogout = () => {
    setToken(null);
    setStoredUser(null);
    setCurrentUser(null);
    setCurrentView('dashboard');
    setAuthView('welcome');
    setSidebarOpen(false);
  };

  const closeTutorial = () => {
    if (currentUser) {
      localStorage.setItem(`plopp_tutorial_seen_${currentUser.rol}`, '1');
    }
    setShowTutorial(false);
  };

  if (!currentUser) {
    if (authView === 'login') {
      return <LoginView onLogin={handleLogin} onBack={() => setAuthView('welcome')} />;
    }

    if (authView === 'register') {
      return (
        <RegisterView
          onBack={() => setAuthView('welcome')}
          onRegistered={handleRegistered}
        />
      );
    }

    return (
      <WelcomeView
        onGoToLogin={() => setAuthView('login')}
        onGoToRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <div className="app-container">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="mobile-topbar">
        <span className="mobile-topbar-title">Plopp Library</span>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <Sidebar
        currentView={currentView}
        setCurrentView={handleNavChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={currentUser.rol}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowTutorial={() => setShowTutorial(true)}
      />

      <main className={`main-content ${currentView === 'home' ? 'main-content-reader-home' : ''}`}>
        {renderView()}
      </main>

      {showTutorial && <TutorialModal role={currentUser.rol} onClose={closeTutorial} />}
      <AIAssistant role={currentUser.rol} />
    </div>
  );
}

export default App;

