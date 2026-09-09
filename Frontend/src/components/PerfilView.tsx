import { useEffect, useRef, useState } from 'react';
import { Camera, Save, Star, BookOpen, BookMarked, Clock, CheckCircle2, Trophy,
         PenLine, Award, BookOpenCheck, Flame, Sparkles, Users, Lock } from 'lucide-react';
import type { CurrentUser, Perfil, Resena, ListaLectura, StatsUsuario } from '../types';
import { api, resolveImageUrl } from '../api';
import { useToast } from './Toast';

interface PerfilViewProps {
  currentUser: CurrentUser | null;
}

function iniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} fill={i < Math.round(valor) ? 'var(--lime)' : 'none'} color={i < Math.round(valor) ? 'var(--lime)' : 'var(--text-muted)'} />
      ))}
    </div>
  );
}

const BADGES = [
  { id: 'primer_paso',   icon: PenLine,       label: 'Primer Paso',    desc: 'Escribe tu primera reseña',      check: (s: StatsUsuario) => s.resenas >= 1 },
  { id: 'critico',       icon: Award,         label: 'Crítico',        desc: '10 reseñas publicadas',           check: (s: StatsUsuario) => s.resenas >= 10 },
  { id: 'bibliofilo',    icon: BookOpenCheck, label: 'Bibliófilo',     desc: '20 libros en tu lista',           check: (s: StatsUsuario) => (s.leidos + s.leyendo + s.quiero_leer) >= 20 },
  { id: 'voraz',         icon: Flame,         label: 'Lector Voraz',   desc: '50 libros leídos',                check: (s: StatsUsuario) => s.leidos >= 50 },
  { id: 'influencer',    icon: Sparkles,      label: 'Influencer',     desc: '100 seguidores',                  check: (s: StatsUsuario) => s.seguidores >= 100 },
  { id: 'social',        icon: Users,         label: 'Social',         desc: '10 personas siguiéndote',         check: (s: StatsUsuario) => s.seguidores >= 10 },
];

export const PerfilView: React.FC<PerfilViewProps> = ({ currentUser }) => {
  const { showToast }            = useToast();
  const fileInput                = useRef<HTMLInputElement>(null);
  const [perfil, setPerfil]      = useState<Perfil | null>(null);
  const [bio, setBio]            = useState('');
  const [foto, setFoto]          = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [stats, setStats]        = useState<StatsUsuario | null>(null);
  const [resenas, setResenas]    = useState<Resena[]>([]);
  const [lista, setLista]        = useState<ListaLectura[]>([]);
  const [tab, setTab]            = useState<'resenas' | 'quiero_leer' | 'leyendo' | 'leido'>('resenas');

  useEffect(() => {
    if (!currentUser?.id_usuario) return;
    Promise.all([
      api(`/perfil/${currentUser.id_usuario}`),
      api('/social/mis-stats'),
      api('/resenas'),
      api('/lista-lectura'),
    ]).then(async ([pRes, sRes, rRes, lRes]) => {
      if (pRes.ok) { const d: Perfil = await pRes.json(); setPerfil(d); setBio(d.bio || ''); setFoto(d.foto_url || null); }
      if (sRes.ok) setStats(await sRes.json());
      if (rRes.ok) {
        const todas: Resena[] = await rRes.json();
        setResenas(todas.filter(r => r.id_usuario === currentUser.id_usuario));
      }
      if (lRes.ok) setLista(await lRes.json());
    }).catch(() => {});
  }, [currentUser?.id_usuario]);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { showToast('La imagen es muy pesada (máx 1.5MB).', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGuardar = async () => {
    if (!currentUser?.id_usuario) return;
    setGuardando(true);
    try {
      const res = await api(`/perfil/${currentUser.id_usuario}`, {
        method: 'PUT',
        body: JSON.stringify({ foto_url: foto, bio }),
      });
      if (!res.ok) throw new Error();
      showToast('Perfil actualizado correctamente', 'success');
    } catch { showToast('No se pudo guardar el perfil', 'warning'); }
    finally { setGuardando(false); }
  };

  const cambiarEstadoLibro = async (idEntrada: number, nuevoEstado: ListaLectura['estado'] | 'quitar') => {
    try {
      if (nuevoEstado === 'quitar') {
        const res = await api(`/lista-lectura/${idEntrada}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        setLista(prev => prev.filter(l => l.id !== idEntrada));
        showToast('Libro quitado de tu lista', 'success');
      } else {
        const entrada = lista.find(l => l.id === idEntrada);
        if (!entrada) return;
        const res = await api('/lista-lectura', {
          method: 'POST',
          body: JSON.stringify({ id_libro: entrada.id_libro, estado: nuevoEstado }),
        });
        if (!res.ok) throw new Error();
        setLista(prev => prev.map(l => l.id === idEntrada ? { ...l, estado: nuevoEstado } : l));
        showToast('Lista de lectura actualizada', 'success');
      }
    } catch { showToast('No se pudo actualizar la lista', 'warning'); }
  };

  const listaFiltrada = lista.filter(l => {
    if (tab === 'quiero_leer') return l.estado === 'quiero_leer';
    if (tab === 'leyendo')     return l.estado === 'leyendo';
    if (tab === 'leido')       return l.estado === 'leido';
    return false;
  });

  const badgesDesbloqueados = stats ? BADGES.filter(b => b.check(stats)) : [];
  const badgesLocked        = stats ? BADGES.filter(b => !b.check(stats)) : BADGES;

  return (
    <div className="perfil-view">
      {/* ── Cabecera del perfil ── */}
      <div className="perfil-header-card">
        <div className="profile-photo-wrap">
          {foto
            ? <img src={resolveImageUrl(foto)} alt="Tu foto de perfil" className="profile-photo" />
            : <div className="profile-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>
                {iniciales(currentUser?.nombre_usuario || 'Lector')}
              </div>
          }
          <button type="button" className="profile-photo-upload" onClick={() => fileInput.current?.click()}>
            <Camera size={14} />
          </button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleFoto} />
        </div>

        <div className="perfil-header-info">
          <h2>{currentUser?.nombre_usuario ?? perfil?.nombre}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{currentUser?.correo ?? perfil?.correo}</p>

          {/* Stats sociales */}
          {stats && (
            <div className="perfil-stats-row">
              <div className="perfil-stat"><strong>{stats.seguidores}</strong><span>Seguidores</span></div>
              <div className="perfil-stat"><strong>{stats.seguidos}</strong><span>Siguiendo</span></div>
              <div className="perfil-stat"><strong>{stats.resenas}</strong><span>Reseñas</span></div>
              <div className="perfil-stat"><strong>{stats.leidos}</strong><span>Leídos</span></div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bio ── */}
      <div className="perfil-section">
        <div className="form-group">
          <label htmlFor="bio">Sobre mí</label>
          <textarea
            id="bio"
            className="form-control"
            style={{ minHeight: 80 }}
            maxLength={280}
            placeholder="Cuéntale a la comunidad qué te gusta leer..."
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bio.length}/280</span>
        </div>
        <button type="button" className="btn-primary" onClick={handleGuardar} disabled={guardando} style={{ alignSelf: 'flex-start' }}>
          <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>

      {/* ── Logros ── */}
      <div className="perfil-section">
        <h3 className="perfil-section-title"><Trophy size={18} /> Logros</h3>
        <div className="badges-grid">
          {badgesDesbloqueados.map(b => {
            const Icon = b.icon;
            return (
              <div key={b.id} className="badge-card unlocked" title={b.desc}>
                <span className="badge-icon"><Icon size={24} /></span>
                <span className="badge-label">{b.label}</span>
              </div>
            );
          })}
          {badgesLocked.map(b => (
            <div key={b.id} className="badge-card locked" title={b.desc}>
              <span className="badge-icon"><Lock size={22} /></span>
              <span className="badge-label">{b.label}</span>
              <span className="badge-desc">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs: Reseñas y Listas ── */}
      <div className="perfil-section">
        <div className="perfil-tabs">
          <button className={`perfil-tab ${tab === 'resenas' ? 'active' : ''}`} onClick={() => setTab('resenas')}>
            <Star size={14} /> Mis Reseñas ({resenas.length})
          </button>
          <button className={`perfil-tab ${tab === 'quiero_leer' ? 'active' : ''}`} onClick={() => setTab('quiero_leer')}>
            <BookMarked size={14} /> Quiero leer ({lista.filter(l => l.estado === 'quiero_leer').length})
          </button>
          <button className={`perfil-tab ${tab === 'leyendo' ? 'active' : ''}`} onClick={() => setTab('leyendo')}>
            <Clock size={14} /> Leyendo ({lista.filter(l => l.estado === 'leyendo').length})
          </button>
          <button className={`perfil-tab ${tab === 'leido' ? 'active' : ''}`} onClick={() => setTab('leido')}>
            <CheckCircle2 size={14} /> Leídos ({lista.filter(l => l.estado === 'leido').length})
          </button>
        </div>

        {tab === 'resenas' && (
          resenas.length === 0 ? (
            <div className="perfil-empty">Aún no has escrito reseñas. Visita el catálogo de libros para empezar.</div>
          ) : (
            <div className="perfil-resenas-grid">
              {resenas.map(r => (
                <div key={r.id_resena} className="perfil-resena-card">
                  {r.portada
                    ? <img src={resolveImageUrl(r.portada)} alt={r.titulo} />
                    : <div className="perfil-resena-placeholder"><BookOpen size={22} /></div>
                  }
                  <Estrellas valor={r.calificacion} />
                  <strong>{r.titulo}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.autor}</span>
                  {r.comentario && <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--text-muted)' }}>{r.comentario.slice(0, 70)}{r.comentario.length > 70 ? '…' : ''}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {tab !== 'resenas' && (
          listaFiltrada.length === 0 ? (
            <div className="perfil-empty">
              {tab === 'quiero_leer' && 'Agrega libros a "Quiero leer" desde el catálogo.'}
              {tab === 'leyendo'     && 'Marca un libro como "Leyendo" para verlo aquí.'}
              {tab === 'leido'       && 'Cuando termines un libro, márcalo como "Leído".'}
            </div>
          ) : (
            <div className="lista-lectura-grid">
              {listaFiltrada.map(l => (
                <div key={l.id} className="lista-lectura-card">
                  {l.portada
                    ? <img src={resolveImageUrl(l.portada)} alt={l.titulo} />
                    : <div className="lista-book-placeholder"><BookOpen size={20} /></div>
                  }
                  <div className="lista-book-info">
                    <strong>{l.titulo}</strong>
                    <span>{l.autor}</span>
                    <select
                      className="lista-estado-select"
                      value={l.estado}
                      onChange={e => cambiarEstadoLibro(l.id, e.target.value as ListaLectura['estado'])}
                    >
                      <option value="quiero_leer">Quiero leer</option>
                      <option value="leyendo">Leyendo</option>
                      <option value="leido">Leído</option>
                    </select>
                    <button className="lista-quitar-btn" onClick={() => cambiarEstadoLibro(l.id, 'quitar')}>
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
