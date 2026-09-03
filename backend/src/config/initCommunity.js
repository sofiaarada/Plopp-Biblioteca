import db from './db.js';

export async function initializeCommunityTables() {
  const [descriptionColumn] = await db.query(
    `SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'libros' AND COLUMN_NAME = 'descripcion'`
  );
  if (descriptionColumn[0].total === 0) {
    await db.query('ALTER TABLE libros ADD COLUMN descripcion TEXT NULL');
  }

    await db.query(`
        CREATE TABLE IF NOT EXISTS perfiles (
          id_usuario INT PRIMARY KEY,
          foto_url MEDIUMTEXT NULL,
          bio VARCHAR(280) NULL,
          CONSTRAINT fk_perfil_usuario FOREIGN KEY (id_usuario)
            REFERENCES usuarios(id_usuario) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    await db.query(`
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
        ) ENGINE=InnoDB
    `);

    await db.query(`
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
        ) ENGINE=InnoDB
    `);

    await db.query(`
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
        ) ENGINE=InnoDB
    `);
}