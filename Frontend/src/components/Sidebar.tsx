import { useEffect, useState } from 'react';
import { BookOpen, Users, Library, Activity, X, ShieldCheck, LogOut, Sun, Moon,
         UserCircle2, HelpCircle, Bell, MessageSquare } from 'lucide-react';
import type { CurrentUser } from '../types';
import { api } from '../api';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: CurrentUser['rol'];
  currentUser?: CurrentUser | null;
  currentUserId?: number | null;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onShowTutorial?: () => void;
  notifCount?: number;
  msgCount?: number;
  onOpenNotificaciones?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView, setCurrentView, userRole, currentUser, currentUserId,
  onLogout, isOpen = false, onClose,
  theme = 'light', onToggleTheme, onShowTutorial,
  notifCount: propNotifCount, msgCount: propMsgCount,
  onOpenNotificaciones,
}) => {
  const [internalNotifCount, setInternalNotifCount] = useState(0);
  const [internalMsgCount,   setInternalMsgCount]   = useState(0);

  const notifCount = propNotifCount !== undefined ? propNotifCount : internalNotifCount;
  const msgCount   = propMsgCount !== undefined   ? propMsgCount   : internalMsgCount;

  // Polling de respaldo en caso de no recibir props
  useEffect(() => {
    if (propNotifCount !== undefined && propMsgCount !== undefined) return;
    if (!currentUserId || userRole !== 'usuario') return;
    const fetchBadges = async () => {
      try {
        const [nRes, mRes] = await Promise.all([
          api('/notificaciones/no-leidas'),
          api('/chat/no-leidos'),
        ]);
        if (nRes.ok) { const d = await nRes.json(); setInternalNotifCount(d.total ?? 0); }
        if (mRes.ok) { const d = await mRes.json(); setInternalMsgCount(d.total ?? 0); }
      } catch { /* ignore */ }
    };
    fetchBadges();
    const id = setInterval(fetchBadges, 30000);
    return () => clearInterval(id);
  }, [currentUserId, userRole, propNotifCount, propMsgCount]);

  const adminItems = [
    { id: 'dashboard', label: 'Resumen',    icon: Activity },
    { id: 'books',     label: 'Catálogo',   icon: BookOpen },
    { id: 'users',     label: 'Usuarios',   icon: Users },
    { id: 'loans',     label: 'Préstamos',  icon: Library },
    { id: 'accounts',  label: 'Cuentas',    icon: ShieldCheck },
  ];

  const userItems = [
    { id: 'home',      label: 'Inicio',    icon: Activity },
    { id: 'books',     label: 'Catálogo',  icon: BookOpen },
    { id: 'community', label: 'Comunidad', icon: Users },
    { id: 'chat',      label: 'Mensajes',  icon: MessageSquare,   badge: msgCount },
    { id: 'loans',     label: 'Préstamos', icon: Library },
    { id: 'profile',   label: 'Mi Perfil', icon: UserCircle2,     badge: notifCount },
  ];

  const libItems = [
    { id: 'dashboard', label: 'Resumen',    icon: Activity },
    { id: 'books',     label: 'Catálogo',   icon: BookOpen },
    { id: 'users',     label: 'Usuarios',   icon: Users },
    { id: 'loans',     label: 'Préstamos',  icon: Library },
  ];

  const navItems =
    userRole === 'admin'         ? adminItems :
    userRole === 'bibliotecario' ? libItems   : userItems;

  // En móvil: 5 ítems ideales para evitar scroll horizontal y elementos cortados
  const mobileNavItems = userRole === 'usuario'
    ? [
        { id: 'home',      label: 'Inicio',    icon: Activity },
        { id: 'books',     label: 'Catálogo',  icon: BookOpen },
        { id: 'community', label: 'Comunidad', icon: Users },
        { id: 'chat',      label: 'Mensajes',  icon: MessageSquare, badge: msgCount },
        { id: 'profile',   label: 'Perfil',    icon: UserCircle2,   badge: notifCount },
      ]
    : navItems;

  const handleItemClick = (id: string) => {
    setCurrentView(id);
    onClose?.();
  };

  const userInitial = (currentUser?.nombre_usuario || 'U').slice(0, 2).toUpperCase();

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-group">
            <h1>Plopp</h1>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        {/* Tarjeta de usuario en el menú lateral */}
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {currentUser?.foto ? (
              <img src={currentUser.foto} alt={currentUser.nombre_usuario} />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {currentUser?.nombre_completo || currentUser?.nombre_usuario || 'Lector Plopp'}
            </span>
            <span className="sidebar-role-badge">
              {userRole === 'admin' ? 'Administrador' : userRole === 'bibliotecario' ? 'Bibliotecario' : 'Lector'}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-section-title">Navegación</div>
          {navItems.map((item) => {
            const Icon  = item.icon;
            const badge = (item as any).badge ?? 0;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-item-icon-wrap">
                  <Icon size={20} />
                  {badge > 0 && (
                    <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>
                  )}
                </span>
                <span className="nav-item-text">{item.label}</span>
                {isActive && <span className="nav-active-pill" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-divider" />
          {userRole === 'usuario' && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onOpenNotificaciones?.();
                onClose?.();
              }}
            >
              <span className="nav-item-icon-wrap">
                <Bell size={18} />
                {notifCount > 0 && <span className="nav-badge">{notifCount > 99 ? '99+' : notifCount}</span>}
              </span>
              <span className="nav-item-text">Notificaciones</span>
            </button>
          )}

          <button type="button" className="nav-item" onClick={() => { onShowTutorial?.(); onClose?.(); }}>
            <HelpCircle size={18} />
            <span className="nav-item-text">¿Cómo funciona?</span>
          </button>

          <button type="button" className="nav-item" onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="nav-item-text">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>

          <button type="button" className="logout-button" onClick={() => { onLogout(); onClose?.(); }}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Barra de navegación inferior móvil — 5 elementos limpios y optimizados */}
      <nav className="mobile-bottom-nav" aria-label="Navegación principal">
        {mobileNavItems.map((item) => {
          const Icon  = item.icon;
          const badge = (item as any).badge ?? 0;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentView(item.id)}
              className={isActive ? 'active' : ''}
              aria-label={item.label}
            >
              <span className="nav-icon-wrapper">
                <Icon size={20} />
                {badge > 0 && (
                  <span className="nav-badge-mobile">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="nav-bottom-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

