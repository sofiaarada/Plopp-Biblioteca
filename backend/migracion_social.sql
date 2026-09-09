
-- 1. Seguimientos (seguidores / seguidos)
CREATE TABLE IF NOT EXISTS seguimientos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  id_seguidor INT NOT NULL,
  id_seguido  INT NOT NULL,
  fecha       DATETIME DEFAULT NOW(),
  UNIQUE KEY uq_seguimiento (id_seguidor, id_seguido),
  FOREIGN KEY (id_seguidor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_seguido)  REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 2. Mensajes de chat entre usuarios
CREATE TABLE IF NOT EXISTS mensajes (
  id_mensaje          INT AUTO_INCREMENT PRIMARY KEY,
  id_emisor           INT NOT NULL,
  id_receptor         INT NOT NULL,
  contenido           TEXT NOT NULL,
  fecha               DATETIME DEFAULT NOW(),
  leido               BOOLEAN DEFAULT FALSE,
  id_libro_recomendado INT NULL,
  FOREIGN KEY (id_emisor)   REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_receptor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 3. Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id_notif   INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo       ENUM('seguimiento','mensaje','like','mencion','recomendacion') NOT NULL,
  mensaje    TEXT NOT NULL,
  id_origen  INT NULL,
  leida      BOOLEAN DEFAULT FALSE,
  fecha      DATETIME DEFAULT NOW(),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 4. Likes en publicaciones
CREATE TABLE IF NOT EXISTS likes_publicaciones (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  id_publicacion INT NOT NULL,
  fecha          DATETIME DEFAULT NOW(),
  UNIQUE KEY uq_like (id_usuario, id_publicacion),
  FOREIGN KEY (id_usuario)     REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 5. Listas de lectura personales
CREATE TABLE IF NOT EXISTS listas_lectura (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_libro   INT NOT NULL,
  estado     ENUM('quiero_leer','leyendo','leido') DEFAULT 'quiero_leer',
  fecha      DATETIME DEFAULT NOW(),
  UNIQUE KEY uq_lista (id_usuario, id_libro),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_libro)   REFERENCES libros(id_libro)     ON DELETE CASCADE
);

SELECT 'Tablas sociales creadas con éxito ✅' AS resultado;
