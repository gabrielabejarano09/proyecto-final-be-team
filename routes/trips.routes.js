const express = require("express");
const router = express.Router();
const authMiddleware = require("./middleware/auth.middleware");
const { initializeFirebase } = require("./firebase"); // Importa la configuración de Firebase

// Inicializar Firebase y obtener las colecciones
const { collections } = initializeFirebase();
const { trips, users } = collections;

// Crear un viaje (asociado con el conductor)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // ID del usuario autenticado
    const userRef = users.doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userData = userDoc.data();

    // Verificar si el usuario tiene un vehículo registrado
    if (!userData.vehicle) {
      return res.status(400).json({
        message: "El usuario no tiene un vehículo registrado. Registra un vehículo primero.",
      });
    }

    // Obtener y validar los datos necesarios del viaje desde el cuerpo de la solicitud
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

    if (!tripDate || !origin || !destination || !arrivalTime || !departureTime || !cost || !paymentMethods) {
      return res.status(400).json({ message: "Faltan campos obligatorios del viaje" });
    }

    // Crear el objeto del viaje con la información completa
    const newTrip = {
      driverId: userId,
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
      cost,
      paymentMethods,
      affinity,
      description,
      createdAt: new Date(),
      status: "scheduled",
    };

    // Crear el viaje en la colección "trips"
    const tripRef = await trips.add(newTrip);
    res.status(201).send({ id: tripRef.id, message: "Viaje creado exitosamente" });
  } catch (error) {
    console.error("Error creando el viaje:", error);
    res.status(500).send("Error al crear el viaje");
  }
});

// Obtener todos los viajes
router.get("/", async (req, res) => {
  try {
    const tripsSnapshot = await trips.get();
    const allTrips = tripsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(allTrips);
  } catch (error) {
    console.error("Error obteniendo los viajes:", error);
    res.status(500).send("Error al obtener los viajes");
  }
});

// Obtener un viaje por ID
router.get("/:id", async (req, res) => {
  try {
    const tripId = req.params.id;
    const tripDoc = await trips.doc(tripId).get();
    if (!tripDoc.exists) {
      return res.status(404).send("Viaje no encontrado");
    }
    res.status(200).json({ id: tripDoc.id, ...tripDoc.data() });
  } catch (error) {
    console.error("Error obteniendo el viaje:", error);
    res.status(500).send("Error al obtener el viaje");
  }
});

// Actualizar un viaje por ID
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const tripId = req.params.id;
    const updatedData = req.body;
    await trips.doc(tripId).update(updatedData);
    res.status(200).send("Viaje actualizado exitosamente");
  } catch (error) {
    console.error("Error actualizando el viaje:", error);
    res.status(500).send("Error al actualizar el viaje");
  }
});

// Eliminar un viaje por ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const tripId = req.params.id;
    await trips.doc(tripId).delete();
    res.status(200).send("Viaje eliminado exitosamente");
  } catch (error) {
    console.error("Error eliminando el viaje:", error);
    res.status(500).send("Error al eliminar el viaje");
  }
});

module.exports = router;