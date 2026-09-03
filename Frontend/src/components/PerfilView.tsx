import { useEffect, useRef, useState } from 'react';
import { Camera, Save } from 'lucide-react';
import type { CurrentUser, Perfil } from '../types';
import { api } from '../api';
import { useToast } from './Toast';

interface PerfilViewProps {
  currentUser: CurrentUser | null;
}

function iniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export const PerfilView: React.FC<PerfilViewProps> = ({ currentUser }) => {
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [bio, setBio] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!currentUser?.id_usuario) return;
    api(`/perfil/${currentUser.id_usuario}`)
      .then((r) => r.json())
      .then((data: Perfil) => {
        setPerfil(data);
        setBio(data.bio || '');
        setFoto(data.foto_url || null);
      })
      .catch(() => undefined);
  }, [currentUser?.id_usuario]);

  const handleFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      showToast('La imagen es muy pesada, usa una menor a 1.5MB.', 'warning');
      return;
    }
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
      showToast('Perfil actualizado', 'success');
    } catch {
      showToast('No se pudo guardar el perfil', 'warning');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="profile-header">
        <div className="profile-photo-wrap">
          {foto ? (
            <img src={foto} alt="Tu foto de perfil" className="profile-photo" />
          ) : (
            <div className="profile-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: 'var(--navy)' }}>
              {iniciales(currentUser?.nombre_usuario || 'Lector Plopp')}
            </div>
          )}
          <button type="button" className="profile-photo-upload" onClick={() => fileInput.current?.click()}>
            <Camera size={14} />
          </button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleFoto} />
        </div>
        <div>
          <h2 style={{ marginBottom: 4 }}>{currentUser?.nombre_usuario ?? perfil?.nombre}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{currentUser?.correo ?? perfil?.correo}</p>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="bio">Sobre mí</label>
        <textarea
          id="bio"
          className="form-control"
          style={{ minHeight: 90 }}
          maxLength={280}
          placeholder="Cuéntale a la comunidad qué te gusta leer..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bio.length}/280</span>
      </div>

      <button type="button" className="btn-primary" onClick={handleGuardar} disabled={guardando}>
        <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar perfil'}
      </button>
    </div>
  );
};
