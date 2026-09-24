const DroneModel = require('../models/droneModel');

const DroneService = {
    // 1km = 2% de batería
    calculateRequiredBattery: (distanceKm) => distanceKm * 2,

    dispatch: (droneId, distanceKm) => {
        const drone = DroneModel.findById(droneId);
        if (!drone) throw new Error('Dron no encontrado');
        if (drone.status !== 'idle') throw new Error('Dron no disponible');

        const requiredBattery = DroneService.calculateRequiredBattery(distanceKm);

        if (drone.battery < requiredBattery) {
            throw new Error('Batería insuficiente');
        }

        // ============================================================
        // BUG #1 CORREGIDO - "Cálculo de Drenaje"
        // Original:  drone.battery -= distanceKm;
        // Problema:  restaba la distancia directa (km) en vez del consumo
        //            real (requiredBattery = distanceKm * 2). Esto permitía
        //            vuelos "gratis" que gastaban la mitad de batería real,
        //            provocando que un dron despegara sin energía suficiente
        //            para completar el trayecto.
        // Fix:       restar SIEMPRE requiredBattery.
        // ============================================================
        drone.battery -= requiredBattery;

        // ============================================================
        // BUG #2 CORREGIDO - "Estado Fantasma"
        // Original:  nunca se actualizaba drone.status tras el despacho.
        // Problema:  el dron seguía apareciendo como 'idle', por lo que
        //            podía ser asignado a múltiples entregas simultáneas.
        // Fix:       marcar el dron como 'en-vuelo' inmediatamente después
        //            de validar y descontar la batería.
        // ============================================================
        drone.status = 'en-vuelo';

        return drone;
    }
};

module.exports = DroneService;
