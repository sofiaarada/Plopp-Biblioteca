-- Migración: módulo de Comunidad para Plopp Library
-- Ejecuta este archivo una vez sobre tu base de datos bibliotecaFerry_db
-- (por ejemplo: mysql -u root -p -P 3300 bibliotecaFerry_db < migracion_comunidad.sql)

USE bibliotecaFerry_db;

ALTER TABLE libros ADD COLUMN IF NOT EXISTS descripcion TEXT NULL;

-- Perfil extendido del usuario (foto y biografía corta)
CREATE TABLE IF NOT EXISTS perfiles (
  id_usuario INT PRIMARY KEY,
  foto_url MEDIUMTEXT NULL,
  bio VARCHAR(280) NULL,
  CONSTRAINT fk_perfil_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Reseñas de libros (calificación en estrellas + comentario)
CREATE TABLE IF NOT EXISTS resenas (
  id_resena INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_libro INT NOT NULL,
  calificacion TINYINT NOT NULL,
  comentario VARCHAR(500) NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resena_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_resena_libro FOREIGN KEY (id_libro)
    REFERENCES libros(id_libro) ON DELETE CASCADE,
  CONSTRAINT chk_calificacion CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- Publicaciones del feed de comunidad (recomendar / comentar un libro)
CREATE TABLE IF NOT EXISTS publicaciones (
  id_publicacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_libro INT NULL,
  contenido VARCHAR(500) NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_publicacion_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_publicacion_libro FOREIGN KEY (id_libro)
    REFERENCES libros(id_libro) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS respuestas_comunidad (
  id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo_origen ENUM('publicacion', 'resena') NOT NULL,
  id_origen INT NOT NULL,
  contenido VARCHAR(500) NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_respuesta_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_respuestas_origen (tipo_origen, id_origen)
) ENGINE=InnoDB;
