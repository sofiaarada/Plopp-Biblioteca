import mysql from 'mysql2/promise';

const main = async () => {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'root',
        database: 'bibliotecaFerry_db',
        port: 3300
    });

    const [usuarios] = await connection.query('DESCRIBE usuarios');
    console.log('--- TABLA USUARIOS ---');
    console.table(usuarios);

    const [libros] = await connection.query('DESCRIBE libros');
    console.log('\n--- TABLA LIBROS ---');
    console.table(libros);

    const [prestamos] = await connection.query('DESCRIBE prestamos');
    console.log('\n--- TABLA PRESTAMOS ---');
    console.table(prestamos);

    await connection.end();
};

main().catch(console.error);
