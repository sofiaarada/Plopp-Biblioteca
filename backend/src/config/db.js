import 'dotenv/config';
import { readFileSync } from 'fs';
import mysql from 'mysql2';

const dbHost = process.env.DB_HOST || '127.0.0.1';

const config = {
    host: dbHost,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'bibliotecaFerry_db',
    port: Number(process.env.DB_PORT) || 3300,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

if (process.env.DB_SSL === 'true') {
    let ca;
    if (process.env.DB_CA_CERT_PATH) {
        try { ca = readFileSync(process.env.DB_CA_CERT_PATH, 'utf8'); }
        catch (e) { console.error('❌ No se pudo leer DB_CA_CERT_PATH:', process.env.DB_CA_CERT_PATH, e.message); }
    } else if (process.env.DB_CA_CERT) {
        ca = process.env.DB_CA_CERT.replace(/\\n/g, '\n');
    }
    // "servername" conserva el host real para validar el certificado aunque
    // se conecte por IP (DB_HOST = IP directa). En la nube DB_HOST ya es el
    // hostname, así que DB_SERVERNAME no hace falta.
    config.ssl = {
        ca,
        rejectUnauthorized: true,
        servername: process.env.DB_SERVERNAME || dbHost
    };
}

const pool = mysql.createPool(config);
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error de conexión:', err.message);
    } else {
        console.log('✅ Conexión exitosa a MySQL');
        connection.release();
    }
});

export default pool.promise();
