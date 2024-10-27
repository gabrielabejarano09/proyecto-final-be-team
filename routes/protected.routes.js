const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

router.get('/ruta-protegida', authMiddleware, (req, res) => {
    res.json({ 
        message: 'Acceso exitoso a ruta protegida',
        user: req.user
    });
});

module.exports = router;