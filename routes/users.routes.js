const express = require('express');
const router = express.Router();

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const snapshot = await req.app.locals.collections.users.get();
        const users = [];
        snapshot.forEach(doc => {
            const userData = doc.data();
            const { password, ...userWithoutPassword } = userData;
            users.push({ id: doc.id, ...userWithoutPassword });
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Crear un nuevo usuario 
router.post('/', async (req, res) => {
    try {
        const { email, name, role } = req.body;
        const docRef = await req.app.locals.collections.users.add({
            email,
            name,
            role,
            createdAt: new Date()
        });
        res.status(201).json({ id: docRef.id, message: 'Usuario creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

module.exports = router;