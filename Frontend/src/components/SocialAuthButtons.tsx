import { useEffect, useRef } from 'react';
import { api, setToken } from '../api';
import { useToast } from './Toast';
import type { CurrentUser } from '../types';

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.body.appendChild(script);
  });
}

interface SocialAuthButtonsProps {
  onAuthenticated: (user: CurrentUser) => void;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ onAuthenticated }) => {
  const { showToast } = useToast();
  const tokenClientRef = useRef<any>(null);

  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      loadScript('https://accounts.google.com/gsi/client', 'google-identity-sdk')
        .then(() => {
          if (window.google) {
            tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'openid email profile',
              callback: async (response: any) => {
                if (!response.access_token) return;
                try {
                  const perfil = await fetch(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${response.access_token}` } }
                  ).then((r) => r.json());
                  await finalizarLoginSocial(perfil.name, perfil.email, 'google');
                } catch {
                  showToast('No se pudo completar el login con Google', 'warning');
                }
              },
            });
          }
        })
        .catch(() => showToast('No se pudo cargar el SDK de Google', 'warning'));
    }

    if (FACEBOOK_APP_ID) {
      window.fbAsyncInit = () => {
        window.FB?.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v19.0' });
      };
      loadScript('https://connect.facebook.net/es_LA/sdk.js', 'facebook-jssdk').catch(() =>
        showToast('No se pudo cargar el SDK de Facebook', 'warning')
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalizarLoginSocial = async (nombre: string, correo: string, proveedor: string) => {
    try {
      const respuesta = await api('/loginSocial', {
        method: 'POST',
        body: JSON.stringify({ nombre, correo, proveedor }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) {
        showToast(data.mensaje || 'No se pudo iniciar sesión', 'warning');
        return;
      }
      setToken(data.token ?? null);
      onAuthenticated({ ...(data.usuario as CurrentUser), token: data.token ?? null });
      showToast(`¡Bienvenido, ${nombre.split(' ')[0]}!`, 'success');
    } catch {
      showToast('No se pudo conectar con el servidor', 'warning');
    }
  };

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID || !tokenClientRef.current) {
      showToast(
        'Login con Google desactivado: agrega VITE_GOOGLE_CLIENT_ID en Frontend/.env para activarlo.',
        'info'
      );
      return;
    }
    tokenClientRef.current.requestAccessToken();
  };

  const handleFacebookClick = () => {
    if (!FACEBOOK_APP_ID || !window.FB) {
      showToast(
        'Login con Facebook desactivado: agrega VITE_FACEBOOK_APP_ID en Frontend/.env para activarlo.',
        'info'
      );
      return;
    }
    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          window.FB.api('/me', { fields: 'name,email' }, (perfil: any) => {
            finalizarLoginSocial(perfil.name, perfil.email || `${perfil.id}@facebook.local`, 'facebook');
          });
        } else {
          showToast('Se canceló el login con Facebook', 'info');
        }
      },
      { scope: 'email' }
    );
  };

  return (
    <div className="social-auth-row">
      <button type="button" className="btn-social btn-facebook" onClick={handleFacebookClick}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.23 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.23 22 17.08 22 12.06Z" />
        </svg>
        Facebook
      </button>
      <button type="button" className="btn-social btn-google" onClick={handleGoogleClick}>
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#FFC107" d="M21.6 12.23c0-.68-.06-1.36-.18-2H12v3.79h5.4a4.63 4.63 0 0 1-2 3.04v2.5h3.23c1.9-1.75 2.97-4.33 2.97-7.33Z" />
          <path fill="#FF3D00" d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
          <path fill="#4CAF50" d="M6.41 13.9a5.99 5.99 0 0 1 0-3.8V7.51H3.06a10 10 0 0 0 0 8.98l3.35-2.59Z" />
          <path fill="#1976D2" d="M12 6.02c1.47 0 2.79.5 3.82 1.5l2.86-2.86A9.96 9.96 0 0 0 12 2 10 10 0 0 0 3.06 7.51l3.35 2.59C7.2 7.78 9.4 6.02 12 6.02Z" />
        </svg>
        Google
      </button>
    </div>
  );
};
