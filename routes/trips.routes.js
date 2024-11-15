const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

// Crear un viaje (asociado con el conductor)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRef = req.app.locals.collections.users.doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userData = userDoc.data();

    if (!userData.vehicle) {
      return res.status(400).json({
        message: "El usuario no tiene un vehículo registrado. Registra un vehículo primero.",
      });
    }

    const {
      tripDate,
      origin,
      destination,
      arrivalTime,
      departureTime,
      cost,
      paymentMethods,
      affinity,
      description,
    } = req.body;

    // Validación mejorada de campos
    if (!tripDate || !origin || !destination || !arrivalTime || !departureTime || !cost || !paymentMethods) {
      return res.status(400).json({ 
        message: "Faltan campos obligatorios del viaje",
        required: ['tripDate', 'origin', 'destination', 'arrivalTime', 'departureTime', 'cost', 'paymentMethods']
      });
    }

    // Validación adicional de datos
    if (isNaN(cost) || cost <= 0) {
      return res.status(400).json({ message: "El costo debe ser un número válido mayor a 0" });
    }

    const newTrip = {
      driverId: userId,
      driverName: userData.name,
      driverVehicle: {
        plate: userData.vehicle.plate,
        color: userData.vehicle.color,
        availableSeats: userData.vehicle.availableSeats,
        brand: userData.vehicle.brand,
        model: userData.vehicle.model,
      },
      tripDate: new Date(tripDate),
      origin,
      destination,
      arrivalTime,
      departureTime,
      cost: Number(cost),
      paymentMethods,
      affinity: affinity || "No especificada",
      description: description || "",
      createdAt: new Date(),
      status: "scheduled",
      passengers: [],
      availableSeats: userData.vehicle.availableSeats
    };

    const tripRef = await req.app.locals.collections.trips.add(newTrip);
    
    res.status(201).json({ 
      success: true,
      message: "Viaje creado exitosamente",
      data: {
        id: tripRef.id,
        ...newTrip
      }
    });
  } catch (error) {
    console.error("Error creando el viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el viaje",
      error: error.message
    });
  }
});

// Obtener todos los viajes
router.get("/", async (req, res) => {
  try {
    const tripsSnapshot = await req.app.locals.collections.trips.get();
    const allTrips = tripsSnapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data(),
      tripDate: doc.data().tripDate.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));
    
    res.status(200).json({
      success: true,
      data: allTrips
    });
  } catch (error) {
    console.error("Error obteniendo los viajes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los viajes",
      error: error.message
    });
  }
});

// Obtener un viaje por ID
router.get("/:id", async (req, res) => {
  try {
    const tripId = req.params.id;
    const tripDoc = await req.app.locals.collections.trips.doc(tripId).get();
    
    if (!tripDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Viaje no encontrado"
      });
    }

    const tripData = tripDoc.data();
    
    res.status(200).json({
      success: true,
      data: {
        id: tripDoc.id,
        ...tripData,
        tripDate: tripData.tripDate.toDate(),
        createdAt: tripData.createdAt.toDate()
      }
    });
  } catch (error) {
    console.error("Error obteniendo el viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el viaje",
      error: error.message
    });
  }
});

// Actualizar un viaje por ID
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const tripId = req.params.id;
    const tripRef = req.app.locals.collections.trips.doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Viaje no encontrado"
      });
    }

    const tripData = tripDoc.data();
    if (tripData.driverId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para modificar este viaje"
      });
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    await tripRef.update(updatedData);
    
    res.status(200).json({
      success: true,
      message: "Viaje actualizado exitosamente"
    });
  } catch (error) {
    console.error("Error actualizando el viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el viaje",
      error: error.message
    });
  }
});

// Eliminar un viaje por ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const tripId = req.params.id;
    const tripRef = req.app.locals.collections.trips.doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Viaje no encontrado"
      });
    }

    const tripData = tripDoc.data();
    if (tripData.driverId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para eliminar este viaje"
      });
    }

    await tripRef.delete();
    
    res.status(200).json({
      success: true,
      message: "Viaje eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error eliminando el viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el viaje",
      error: error.message
    });
  }
});

module.exports = router;