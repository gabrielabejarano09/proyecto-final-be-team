const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { validateLoginRequest, validateRegisterRequest } = require('../middleware/validation.middleware');
const { JWT_SECRET } = require('../config/config');

// Ruta de registro
router.post('/register', validateRegisterRequest, async (req, res, next) => {
    try {
        const { idUni, email, phone, name, password } = req.body;
        
        // Verificar si el usuario ya existe
        const userSnapshot = await req.app.locals.collections.users
            .where('email', '==', email)
            .get();

        if (!userSnapshot.empty) {
            return res.status(400).json({ 
                message: 'El correo electrónico ya está registrado' 
            });
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear nuevo usuario
        const newUser = {
            idUni,
            email,
            phone,
            name,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date()
        };

        // Guardar en Firebase
        const userRef = await req.app.locals.collections.users.add(newUser);

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: userRef.id,
                email: email,
                role: 'user',
                name: name 
            }, 
            JWT_SECRET, 
            { 
                expiresIn: '5s',
                algorithm: 'HS256'
            }
        );

        // Excluir password del objeto de respuesta
        const { password: _, ...userData } = newUser;

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: userData
        });

    } catch (err) {
        next(err);
    }
});

// Ruta de login
router.post('/login', validateLoginRequest, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario en Firebase
        const userSnapshot = await req.app.locals.collections.users
            .where('email', '==', email)
            .get();

        if (userSnapshot.empty) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, userData.password);

        if (!isValidPassword) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }

        // Generar token
        const token = jwt.sign(
            { 
                id: userDoc.id,
                email: userData.email,
                role: userData.role,
                name: userData.name 
            }, 
            JWT_SECRET, 
            { 
                expiresIn: '5s',
                algorithm: 'HS256'
            }
        );

        // Excluir password de la respuesta
        const { password: _, ...userResponse } = userData;

        res.json({ 
            token,
            message: 'Login exitoso',
            user: userResponse
        });

    } catch (err) {
        next(err);
    }
});

router.get('/status', (req, res) => {
    res.json({
        message: 'Servicio de autenticación funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;