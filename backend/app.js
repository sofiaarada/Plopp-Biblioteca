
import express from 'express';

import cors from 'cors';


import usuarioRoutes from './src/routes/usuarioRoutes.js';
import librosRoutes from './src/routes/librosRoutes.js';
import prestamosRoutes from './src/routes/prestamosRoutes.js';
import cuentasRoutes from './src/routes/cuentasRoutes.js';
import perfilRoutes from './src/routes/perfilRoutes.js';
import resenasRoutes from './src/routes/resenasRoutes.js';
import comunidadRoutes from './src/routes/comunidadRoutes.js';
import { initializeCommunityTables } from './src/config/initCommunity.js';


const app = express();


app.use(cors()); 
app.use(express.json()); 


app.get('/', (req, res) => {
    res.send('<h1>Bienvenido a la API de la Biblioteca El Ferry</h1>');
});

app.use('/api', usuarioRoutes);
app.use('/api', librosRoutes);
app.use('/api', prestamosRoutes);
app.use('/api', cuentasRoutes);
app.use('/api', perfilRoutes);
app.use('/api', resenasRoutes);
app.use('/api', comunidadRoutes);

const PORT = process.env.PORT || 3000;

initializeCommunityTables()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor de la Biblioteca Ferry corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('No se pudieron inicializar las tablas de comunidad:', error);
        process.exit(1);
    });