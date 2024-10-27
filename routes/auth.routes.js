const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const validateLoginRequest = require('../middleware/validation.middleware');
const { JWT_SECRET } = require('../config/config');

router.post('/login', validateLoginRequest, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Aquí iría la lógica de verificación con la base de datos
        if (email === "admin@example.com" && password === "12345") {
            const token = jwt.sign(
                { 
                    id: 123,
                    email: email,
                    role: 'user'
                }, 
                JWT_SECRET, 
                { 
                    expiresIn: '10s',
                    algorithm: 'HS256'
                }
            );

            return res.json({ 
                token,
                message: 'Login exitoso'
            });
        }

        res.status(401).json({ 
            message: 'Credenciales inválidas' 
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;