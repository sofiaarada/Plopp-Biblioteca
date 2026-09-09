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
import { ChatView } from './components/ChatView';
import { PerfilPublicoView } from './components/PerfilPublicoView';
import { WelcomeView } from './components/WelcomeView';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { TutorialModal } from './components/TutorialModal';
import { NotificacionesModal } from './components/NotificacionesModal';
import { AIAssistant } from './components/AIAssistant';
import { Moon, Sun, Menu, Bell } from 'lucide-react';
import type { CurrentUser, SocialUser } from './types';
import { getStoredUser, setStoredUser, setToken, api } from './api';
import './App.css';
import './styles/plopp-theme.css';
import './styles/social.css';


const rolePermissions: Record<CurrentUser['rol'], string[]> = {
  admin:        ['dashboard', 'books', 'users', 'loans', 'accounts'],
  bibliotecario:['dashboard', 'books', 'users', 'loans'],
  usuario:      ['home', 'books', 'loans', 'community', 'social', 'foro', 'chat', 'profile'],
};

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => getStoredUser<CurrentUser>());
  const [currentView, setCurrentView] = useState(() => {
    const stored = getStoredUser<CurrentUser>();
    return stored?.rol === 'usuario' ? 'home' : 'dashboard';
  });
  const [authView, setAuthView]     = useState<'welcome' | 'login' | 'register'>('welcome');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const s = localStorage.getItem('bf_theme');
    return s === 'light' || s === 'dark' ? s : 'light';
  });

  // Estado para notificaciones y mensajes en tiempo real
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount,   setMsgCount]   = useState(0);
  const [showNotificaciones, setShowNotificaciones] = useState(false);

  // Estado para chat y perfil público (subnavegación interna)
  const [chatTarget, setChatTarget]     = useState<SocialUser | null>(null);
  const [profileTarget, setProfileTarget] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser?.token) setToken(currentUser.token);
    else if (currentUser?.rol === 'admin') { setStoredUser(null); setCurrentUser(null); setToken(null); }
  }, [currentUser]);

  // Polling para badges de notificaciones y mensajes
  useEffect(() => {
    if (!currentUser?.id_usuario || currentUser.rol !== 'usuario') return;
    const fetchBadges = async () => {
      try {
        const [nRes, mRes] = await Promise.all([
          api('/notificaciones/no-leidas'),
          api('/chat/no-leidos'),
        ]);
        if (nRes.ok) { const d = await nRes.json(); setNotifCount(d.total ?? 0); }
        if (mRes.ok) { const d = await mRes.json(); setMsgCount(d.total ?? 0); }
      } catch { /* ignore */ }
    };
    fetchBadges();
    const id = setInterval(fetchBadges, 30000);
    return () => clearInterval(id);
  }, [currentUser?.id_usuario, currentUser?.rol]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobileViewport && currentUser && currentUser.rol !== 'usuario') {
      setToken(null); setStoredUser(null); setCurrentUser(null);
      setCurrentView('dashboard'); setAuthView('login');
      window.alert('En dispositivos móviles solo está disponible el acceso de usuario lector.');
    }
  }, [isMobileViewport, currentUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bf_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!currentUser) return;
    const key = `plopp_tutorial_seen_${currentUser.rol}`;
    if (!localStorage.getItem(key)) setShowTutorial(true);
  }, [currentUser?.rol]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const startSession = (user: CurrentUser) => {
    if (isMobileViewport && user.rol !== 'usuario') {
      setToken(null); setStoredUser(null); setAuthView('login');
      window.alert('En dispositivos móviles solo está disponible el acceso de usuario lector.');
      return;
    }
    setToken(user.token ?? null);
    setStoredUser(user);
    setCurrentUser(user);
    setCurrentView(user.rol === 'usuario' ? 'home' : 'dashboard');
    setSidebarOpen(false); setAuthView('welcome');
  };

  const openChat = (user: SocialUser) => {
    setChatTarget(user);
    setProfileTarget(null);
    setCurrentView('chat');
  };

  const openProfile = (idUsuario: number) => {
    setProfileTarget(idUsuario);
    setCurrentView('community'); // muestra perfil sobre comunidad
  };

  const handleNavChange = (view: string) => {
    const allowed = currentUser ? rolePermissions[currentUser.rol] : ['dashboard'];
    const next = allowed.includes(view) ? view : 'dashboard';
    // Al cambiar de sección, limpiamos subnavegación
    if (view !== 'community' && view !== 'social' && view !== 'foro') setProfileTarget(null);
    if (view !== 'chat') setChatTarget(null);
    setCurrentView(next);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    setToken(null); setStoredUser(null); setCurrentUser(null);
    setCurrentView('dashboard'); setAuthView('welcome');
    setSidebarOpen(false); setChatTarget(null); setProfileTarget(null);
  };

  const renderView = () => {
    const role = currentUser?.rol ?? 'usuario';

    // Perfil público (subvista sobre comunidad)
    if ((currentView === 'community' || currentView === 'social' || currentView === 'foro') && profileTarget !== null) {
      return (
        <PerfilPublicoView
          currentUser={currentUser}
          idUsuario={profileTarget}
          onBack={() => setProfileTarget(null)}
          onOpenChat={openChat}
        />
      );
    }

    switch (currentView) {
      case 'home':
        return role === 'usuario'
          ? <ReaderHomeView currentUser={currentUser} onNavigate={handleNavChange} />
          : <DashboardView />;
      case 'dashboard':
        return role === 'usuario' ? <BooksView userRole={role} currentUser={currentUser} /> : <DashboardView />;
      case 'books':
        return <BooksView userRole={role} currentUser={currentUser} />;
      case 'users':
        return role === 'usuario' ? <BooksView userRole={role} currentUser={currentUser} /> : <UsersView />;
      case 'loans':
        return <LoansView currentUser={currentUser} />;
      case 'accounts':
        return role === 'admin' ? <AccountsView userRole={role} /> : <BooksView userRole={role} currentUser={currentUser} />;
      case 'community':
      case 'foro':
      case 'social':
        return role === 'admin' || role === 'bibliotecario'
          ? <DashboardView />
          : <CommunityView
              currentUser={currentUser}
              onOpenChat={openChat}
              onOpenProfile={openProfile}
              onNavigate={handleNavChange}
            />;
      case 'chat':
        return role === 'admin' || role === 'bibliotecario'
          ? <DashboardView />
          : <ChatView currentUser={currentUser} initialChat={chatTarget} onClose={() => { setChatTarget(null); setCurrentView('community'); }} />;
      case 'profile':
        return role === 'admin' || role === 'bibliotecario'
          ? <DashboardView />
          : <PerfilView currentUser={currentUser} />;
      default:
        return <BooksView userRole={role} currentUser={currentUser} />;
    }
  };

  if (!currentUser) {
    if (authView === 'login')    return <LoginView onLogin={startSession} onBack={() => setAuthView('welcome')} />;
    if (authView === 'register') return <RegisterView onBack={() => setAuthView('welcome')} onRegistered={startSession} />;
    return <WelcomeView onGoToLogin={() => setAuthView('login')} onGoToRegister={() => setAuthView('register')} />;
  }

  const userInitial = (currentUser.nombre_usuario || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Topbar móvil moderna y rica en funciones */}
      <div className="mobile-topbar">
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div
          className="mobile-topbar-brand"
          onClick={() => handleNavChange(currentUser.rol === 'usuario' ? 'home' : 'dashboard')}
          role="button"
          tabIndex={0}
        >
          <span className="mobile-topbar-title">Plopp</span>
        </div>

        <div className="mobile-topbar-actions">
          {currentUser.rol === 'usuario' && (
            <button
              type="button"
              className="topbar-action-btn notif-btn"
              onClick={() => setShowNotificaciones(true)}
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <Bell size={19} />
              {notifCount > 0 && (
                <span className="topbar-badge">{notifCount > 99 ? '99+' : notifCount}</span>
              )}
            </button>
          )}

          <button
            type="button"
            className="topbar-action-btn theme-btn"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            type="button"
            className="topbar-avatar-btn"
            onClick={() => handleNavChange('profile')}
            aria-label="Mi Perfil"
            title="Mi Perfil"
          >
            <div className="topbar-avatar">
              {currentUser.foto ? (
                <img src={currentUser.foto} alt="" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
          </button>
        </div>
      </div>

      <Sidebar
        currentView={currentView}
        setCurrentView={handleNavChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={currentUser.rol}
        currentUser={currentUser}
        currentUserId={currentUser.id_usuario ?? null}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowTutorial={() => setShowTutorial(true)}
        notifCount={notifCount}
        msgCount={msgCount}
        onOpenNotificaciones={() => setShowNotificaciones(true)}
      />

      <main className={`main-content ${currentView === 'home' ? 'main-content-reader-home' : ''}`}>
        <div key={currentView} className="view-transition-wrapper">
          {renderView()}
        </div>
      </main>

      {showTutorial && (
        <TutorialModal
          role={currentUser.rol}
          onClose={() => {
            if (currentUser) localStorage.setItem(`plopp_tutorial_seen_${currentUser.rol}`, '1');
            setShowTutorial(false);
          }}
        />
      )}

      <NotificacionesModal
        isOpen={showNotificaciones}
        onClose={() => setShowNotificaciones(false)}
        onOpenProfile={openProfile}
        onOpenChat={openChat}
        onNavigate={handleNavChange}
        onNotifRead={() => setNotifCount(0)}
      />

      <AIAssistant role={currentUser.rol} />
    </div>
  );
}

export default App;
