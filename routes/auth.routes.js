const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const validateLoginRequest = require('../middleware/validation.middleware');
const { JWT_SECRET } = require('../config/config');

// Credenciales de ejemplo (en producción esto vendría de una base de datos)
const VALID_CREDENTIALS = {
    'admin@example.com': {
        password: '12345',
        id: 123,
        role: 'admin'
    },
    'user@example.com': {
        password: '12345',
        id: 124,
        role: 'user'
    }
};

// Ruta de login 
router.post('/login', validateLoginRequest, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = VALID_CREDENTIALS[email];

        if (user && user.password === password) {
            const token = jwt.sign(
                { 
                    id: user.id,
                    email: email,
                    role: user.role
                }, 
                JWT_SECRET, 
                { 
                    expiresIn: '5s',
                    algorithm: 'HS256'
                }
            );

            return res.json({ 
                token,
                message: 'Login exitoso',
                user: {
                    email,
                    role: user.role
                }
            });
        }

        res.status(401).json({ 
            message: 'Credenciales inválidas' 
        });
    } catch (err) {
        next(err);
    }
});

// Ruta de status 
router.get('/status', (req, res) => {
    res.json({
        message: 'Servicio de autenticación funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;