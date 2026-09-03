import bcrypt from 'bcryptjs';

const password = '12345678';

bcrypt.hash(password, 10, (err, hash) => {
    if (err){
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Contraseña original:', password);
    console.log('Hashed password:', hash);
});