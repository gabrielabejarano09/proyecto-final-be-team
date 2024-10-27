const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importar configuración
const config = require('./config/config');

// Importar middlewares
const errorHandler = require('./middleware/error.middleware');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');

// Crear instancia de Express
const app = express();

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

// Configurar rutas - MODIFICADO: ahora las rutas de auth están en la raíz
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