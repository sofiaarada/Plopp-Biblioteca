import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Heart, MessageSquare, UserPlus, BookOpen, X, Sparkles } from 'lucide-react';
import type { Notificacion, SocialUser } from '../types';
import { api, resolveImageUrl } from '../api';

interface NotificacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: (idUsuario: number) => void;
  onOpenChat?: (user: SocialUser) => void;
  onNavigate?: (view: string) => void;
  onNotifRead?: () => void;
}

function timeAgo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export const NotificacionesModal: React.FC<NotificacionesModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenChat,
  onNavigate,
  onNotifRead,
}) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [marcando, setMarcando] = useState(false);

  const cargarNotificaciones = async () => {
    setCargando(true);
    try {
      const res = await api('/notificaciones');
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarNotificaciones();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const noLeidasCount = notificaciones.filter(n => !n.leida).length;

  const handleMarcarTodasLeidas = async () => {
    setMarcando(true);
    try {
      const res = await api('/notificaciones/leer', { method: 'PUT' });
      if (res.ok) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        onNotifRead?.();
      }
    } catch {
      // ignore
    } finally {
      setMarcando(false);
    }
  };

  const handleItemClick = (notif: Notificacion) => {
    onClose();
    if (notif.tipo === 'mensaje' && notif.id_origen && onOpenChat) {
      onOpenChat({
        id_usuario: notif.id_origen,
        nombre: notif.nombre_origen || 'Usuario',
        foto_url: notif.foto_url,
        no_leidos: 0,
        yo_sigo: false,
        me_sigue: false,
        total_seguidores: 0,
        total_seguidos: 0,
      });
    } else if (notif.tipo === 'seguimiento' && notif.id_origen && onOpenProfile) {
      onOpenProfile(notif.id_origen);
    } else if (notif.tipo === 'like' && onNavigate) {
      onNavigate('community');
    }
  };

  const renderIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'seguimiento':
        return (
          <span className="notif-type-icon notif-icon-follow">
            <UserPlus size={13} />
          </span>
        );
      case 'like':
        return (
          <span className="notif-type-icon notif-icon-like">
            <Heart size={13} />
          </span>
        );
      case 'mensaje':
        return (
          <span className="notif-type-icon notif-icon-msg">
            <MessageSquare size={13} />
          </span>
        );
      case 'recomendacion':
        return (
          <span className="notif-type-icon notif-icon-rec">
            <BookOpen size={13} />
          </span>
        );
      default:
        return (
          <span className="notif-type-icon notif-icon-default">
            <Bell size={13} />
          </span>
        );
    }
  };

  return (
    <div className="notif-modal-backdrop" onClick={onClose}>
      <div className="notif-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notif-modal-header">
          <div className="notif-modal-title-group">
            <span className="notif-bell-icon">
              <Bell size={20} />
            </span>
            <h3>Notificaciones</h3>
            {noLeidasCount > 0 && (
              <span className="notif-unread-count-pill">
                {noLeidasCount} nueva{noLeidasCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="notif-modal-header-actions">
            {noLeidasCount > 0 && (
              <button
                type="button"
                className="notif-mark-read-btn"
                onClick={handleMarcarTodasLeidas}
                disabled={marcando}
                title="Marcar todas como leídas"
              >
                <CheckCheck size={16} />
                <span>Marcar leídas</span>
              </button>
            )}
            <button
              type="button"
              className="notif-close-btn"
              onClick={onClose}
              aria-label="Cerrar notificaciones"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="notif-modal-body">
          {cargando ? (
            <div className="notif-loading-state">
              <div className="notif-spinner" />
              <span>Cargando notificaciones...</span>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="notif-empty-state">
              <div className="notif-empty-icon-wrap">
                <Sparkles size={32} />
              </div>
              <h4>¡Todo al día!</h4>
              <p>No tienes notificaciones pendientes. Interactúa en la red social y comparte tus libros favoritos.</p>
            </div>
          ) : (
            <div className="notif-list">
              {notificaciones.map((n) => {
                const idKey = n.id_notificacion || n.id_notif || `${n.tipo}-${n.fecha}`;
                const esNoLeida = !n.leida;
                const iniciales = (n.nombre_origen || 'Plopp').slice(0, 2).toUpperCase();

                return (
                  <div
                    key={idKey}
                    className={`notif-item ${esNoLeida ? 'unread' : ''}`}
                    onClick={() => handleItemClick(n)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="notif-avatar-container">
                      {n.foto_url ? (
                        <img src={resolveImageUrl(n.foto_url)} alt={n.nombre_origen || ''} className="notif-avatar" />
                      ) : (
                        <div className="notif-avatar notif-avatar-initials">
                          {iniciales}
                        </div>
                      )}
                      {renderIconoTipo(n.tipo)}
                    </div>

                    <div className="notif-content">
                      <p className="notif-text">
                        <strong>{n.nombre_origen || 'Alguien'}</strong> {n.mensaje}
                      </p>
                      <span className="notif-time">{timeAgo(n.fecha)}</span>
                    </div>

                    {esNoLeida && <span className="notif-unread-dot" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
