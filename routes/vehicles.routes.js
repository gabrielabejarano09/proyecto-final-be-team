const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { validateCar } = require('../middleware/vehicleValidation.middleware');

// Función para comprimir base64 (reducir calidad de imagen)
const compressBase64Image = (base64) => {
    // Si la imagen es muy grande (más de 500KB)
    if (base64.length > 500000) {
        // Reducir calidad manteniendo el formato
        const quality = Math.min(0.7, (500000 / base64.length));
        return base64.split(';base64,').join(`;base64,quality=${quality},`);
    }
    return base64;
};

// Ruta para registrar un nuevo vehículo
router.post('/register-car', [authMiddleware, validateCar], async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener el documento del usuario
        const userRef = req.app.locals.collections.users.doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        const userData = userDoc.data();
        
        // Verificar si el usuario ya tiene un vehículo registrado
        if (userData.vehicle) {
            return res.status(400).json({
                message: 'El usuario ya tiene un vehículo registrado'
            });
        }

        const { plate, color, availableSeats, brand, model, carImage, soatImage } = req.body;

        // Comprimir imágenes antes de guardar
        const compressedCarImage = compressBase64Image(carImage);
        const compressedSoatImage = compressBase64Image(soatImage);

        // Crear objeto del vehículo
        const carData = {
            plate: plate.toUpperCase(),
            color: color.toLowerCase(),
            availableSeats: parseInt(availableSeats),
            brand: brand.trim(),
            model: model.trim(),
            carImage: compressedCarImage,
            soatImage: compressedSoatImage,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'active',
            tripCount: 0,
            lastUsed: null
        };

        // Actualizar el documento del usuario con los datos del vehículo
        await userRef.update({
            vehicle: carData,
            hasVehicle: true,
            updatedAt: new Date()
        });

        // Enviar respuesta sin las imágenes para reducir el tamaño de la respuesta
        const { carImage: img1, soatImage: img2, ...carDataWithoutImages } = carData;
        
        res.status(201).json({
            message: `Vehículo ${plate.toUpperCase()} registrado exitosamente`,
            data: carDataWithoutImages
        });

    } catch (error) {
        console.error('Error registrando el vehículo:', error);
        res.status(500).json({
            message: 'Error al registrar el vehículo',
            error: error.message
        });
    }
});

// Ruta para obtener el vehículo del usuario actual
router.get('/my-car', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRef = req.app.locals.collections.users.doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        const userData = userDoc.data();

        if (!userData.vehicle) {
            return res.status(404).json({
                message: 'No tienes ningún vehículo registrado'
            });
        }

        const { carImage, soatImage, ...vehicleData } = userData.vehicle;

        // Enviar primero los datos básicos
        res.status(200).json({
            data: {
                ...vehicleData,
                hasImages: true
            }
        });

    } catch (error) {
        console.error('Error obteniendo el vehículo:', error);
        res.status(500).json({
            message: 'Error al obtener información del vehículo',
            error: error.message
        });
    }
});

// Nueva ruta para obtener las imágenes del vehículo
router.get('/my-car/images', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRef = req.app.locals.collections.users.doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        const userData = userDoc.data();

        if (!userData.vehicle) {
            return res.status(404).json({
                message: 'No tienes ningún vehículo registrado'
            });
        }

        const { carImage, soatImage } = userData.vehicle;

        res.status(200).json({
            data: {
                carImage,
                soatImage
            }
        });

    } catch (error) {
        console.error('Error obteniendo imágenes del vehículo:', error);
        res.status(500).json({
            message: 'Error al obtener las imágenes del vehículo',
            error: error.message
        });
    }
});

// Nueva ruta para actualizar el estado del vehículo
router.patch('/my-car/status', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.body;

        if (!['active', 'inactive', 'maintenance'].includes(status)) {
            return res.status(400).json({
                message: 'Estado no válido'
            });
        }

        const userRef = req.app.locals.collections.users.doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists || !userDoc.data().vehicle) {
            return res.status(404).json({
                message: 'Vehículo no encontrado'
            });
        }

        await userRef.update({
            'vehicle.status': status,
            'vehicle.updatedAt': new Date()
        });

        res.status(200).json({
            message: `Estado del vehículo actualizado a: ${status}`,
            status
        });

    } catch (error) {
        console.error('Error actualizando estado del vehículo:', error);
        res.status(500).json({
            message: 'Error al actualizar el estado del vehículo',
            error: error.message
        });
    }
});

module.exports = router;