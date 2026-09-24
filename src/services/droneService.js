const DroneModel = require('../models/droneModel');

const DroneService = {
    
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
        // ============================================================
        drone.battery -= requiredBattery;

        // =========================================S===================
        // BUG #2 CORREGIDO - "Estado Fantasma"
        // ============================================================
        drone.status = 'en-vuelo';

        return drone;ñ
    }
};

module.exports = DroneService;
