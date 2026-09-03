import mysql from 'mysql2';

const dbHost = '127.0.0.1';
const dbUser = 'root';
const dbPassword = 'root';
const dbName = 'bibliotecaFerry_db';
const dbPort = 3300;

const config = {
    host: dbHost,
    user: dbUser,
    database: dbName,
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

if (dbPassword) {
    config.password = dbPassword;
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