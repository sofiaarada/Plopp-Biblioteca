
# Plopp — Biblioteca

Plataforma web para la gestión de una biblioteca (usuarios, libros, préstamos) con funciones sociales de lectura: perfiles públicos, comunidad, reseñas, listas de lectura, chat en tiempo real y notificaciones.

Proyecto desarrollado como parte de la formación en Análisis y Desarrollo de Software (SENA).

## Funcionalidades

- **Gestión bibliotecaria:** catálogo de libros, préstamos, cuentas y usuarios.
- **Perfiles de lector:** perfil propio y perfil público, con panel de lector (Dashboard) y estadísticas de lectura.
- **Comunidad:** espacio social entre usuarios, con su propio módulo (`Comunidad`) además del módulo `Social`.
- **Reseñas y listas de lectura:** los usuarios pueden reseñar libros y armar sus propias listas.
- **Chat en tiempo real:** mensajería privada entre usuarios usando Socket.IO.
- **Notificaciones:** sistema de notificaciones dentro de la app.
- **Autenticación:** login/registro propio con contraseña, más inicio de sesión con Google (OAuth) y soporte para autenticación social adicional.
- **Validador de fortaleza de contraseña** al registrarse.
- **Asistente con IA** integrado en la interfaz.
- **Tutorial guiado** para orientar a los usuarios nuevos según su rol.
- **Diseño responsive**, pensado para verse bien también en móvil.

##  Tecnologías

**Frontend**
- React 19 + TypeScript
- Vite
- Axios (consumo de la API)
- Socket.IO Client (chat en tiempo real)
- Recharts (gráficas/estadísticas)
- Lucide React (iconos)
- `@react-oauth/google` (login con Google)

**Backend**
- Node.js + Express 5
- MySQL (driver `mysql2`)
- Socket.IO (servidor de chat en tiempo real)
- JSON Web Tokens (`jsonwebtoken`) para autenticación
- `bcryptjs` para el hash de contraseñas
- `google-auth-library` para validar el login con Google
- `dotenv` para variables de entorno

**Base de datos**
- MySQL

##  Estructura del proyecto

```
plopp/
├── Frontend/                  # Aplicación React + TypeScript (Vite)
│   └── src/
│       ├── components/        # Vistas: Dashboard, Libros, Préstamos, Cuentas,
│       │                      # Comunidad, Social, Chat, Perfil, Login, Registro, etc.
│       ├── api.ts             # Cliente HTTP hacia el backend
│       ├── types.ts           # Tipos compartidos
│       └── styles/            # Estilos del tema Plopp
│
└── backend/                   # API REST + servidor de sockets
    └── src/
        ├── controllers/       # Lógica de negocio por módulo
        ├── routes/            # Endpoints agrupados por módulo
        ├── middleware/        # Autenticación (JWT)
        ├── config/            # Conexión a MySQL e inicialización de tablas
        └── hash/              # Utilidades de hash de contraseñas
```

##  Cómo correrlo localmente

### Requisitos
- Node.js 20+
- MySQL 8

### Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` en `backend/` con:

```
PORT=4000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_NAME=bibliotecaFerry_db
DB_PORT=3306
JWT_SECRET=tu_clave_secreta
GOOGLE_CLIENT_ID=tu_client_id_de_google
```

```bash
node app.js
```

El servidor queda en `http://localhost:4000`.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

### Base de datos

El proyecto incluye migraciones (`migracion_comunidad.sql`, `migracion_social.sql`) para los módulos de comunidad y social. Se necesita además el esquema base (usuarios, libros, préstamos, cuentas) creado en la base `bibliotecaFerry_db` antes de correr el backend.

##  Despliegue con Docker

El proyecto incluye `Dockerfile` para backend y frontend, pensados para desplegarse como servicios independientes (por ejemplo en Render): el backend como servicio web construido con Docker, y el frontend como sitio estático generado con `npm run build`.

##  Roles

La aplicación diferencia vistas y permisos según el rol del usuario (por ejemplo lector/administrador), reflejado en el panel de navegación (`Sidebar`) y en las vistas disponibles.

##  Licencia

Proyecto académico, desarrollado con fines educativos en el marco del programa de Análisis y Desarrollo de Software del SENA.