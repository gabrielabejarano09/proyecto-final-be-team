const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const errorHandler = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');
const app = express();

// inicializar firebase
const { initializeFirebase } = require('./config/firebase.config'); 
const testRoutes = require('./routes/test.routes');

const {db, collections} = initializeFirebase();
app.locals.db = db;
app.locals.collections = collections;
app.use('/test', testRoutes);

// Validar configuración crítica
if (!config.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

// Configurar middlewares de seguridad y parseo
app.use(helmet()); // Seguridad
app.use(express.json()); // Parseo de JSON
app.use(cors({
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Configurar rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 peticiones por ventana
});
app.use(limiter);

// Configurar rutas 
app.use('/', authRoutes);
app.use('/api', protectedRoutes);

// Ruta de healthcheck
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({ 
        message: 'Ruta no encontrada' 
    });
});

// Middleware de manejo de errores
app.use(errorHandler);

module.exports = app;