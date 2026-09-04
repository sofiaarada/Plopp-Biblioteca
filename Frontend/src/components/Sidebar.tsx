import React from 'react';
import { BookOpen, Users, Library, Activity, X, ShieldCheck, LogOut, Sun, Moon, UsersRound, UserCircle2, HelpCircle } from 'lucide-react';
import type { CurrentUser } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: CurrentUser['rol'];
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onShowTutorial?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  userRole,
  onLogout,
  isOpen = false,
  onClose,
  theme = 'light',
  onToggleTheme,
  onShowTutorial,
}) => {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Activity },
    { id: 'dashboard', label: 'Resumen', icon: Activity },
    { id: 'books', label: 'Catálogo', icon: BookOpen },
    { id: 'community', label: 'Comunidad', icon: UsersRound },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'loans', label: 'Préstamos', icon: Library },
    { id: 'accounts', label: 'Cuentas', icon: ShieldCheck },
    { id: 'profile', label: 'Mi Perfil', icon: UserCircle2 },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (userRole === 'admin') return ['dashboard', 'books', 'users', 'loans', 'accounts'].includes(item.id);
    if (userRole === 'bibliotecario') return ['dashboard', 'books', 'users', 'loans'].includes(item.id);
    return ['home', 'books', 'loans', 'community', 'profile'].includes(item.id);
  });

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h1>Plopp</h1>
        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-user">
        <span className="sidebar-role">{userRole}</span>
      </div>

      <nav className="sidebar-nav">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          className="nav-item"
          onClick={onShowTutorial}
          style={{ justifyContent: 'center' }}
        >
          <HelpCircle size={18} />
          <span>¿Cómo funciona?</span>
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={onToggleTheme}
          style={{ justifyContent: 'center' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>

        <button type="button" className="logout-button" onClick={onLogout}>
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>

      </aside>

      <nav className="mobile-bottom-nav" aria-label="Navegación principal">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentView(item.id)}
              className={currentView === item.id ? 'active' : ''}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
