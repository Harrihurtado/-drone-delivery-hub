// PRUEBAS DE REGRESIÓN
// Objetivo: garantizar de forma permanente que los 2 bugs originales
// (Cálculo de Drenaje y Estado Fantasma) nunca vuelvan a reaparecer,
// aunque alguien modifique el código en el futuro.
const DroneModel = require('../../src/models/droneModel');
const DroneService = require('../../src/services/droneService');

describe('Pruebas de Regresión', () => {

    beforeEach(() => {
        DroneModel.reset([
            { id: 'D-01', battery: 100, status: 'idle' }
        ]);
    });

    test('REGRESIÓN 1 (Bug de Drenaje): un vuelo de 10km SIEMPRE consume matemáticamente 20% de batería', () => {
        const dron = DroneService.dispatch('D-01', 10);

        // Si el bug de "restar distancia directa" regresara, battery sería 90.
        expect(dron.battery).toBe(80);
        expect(100 - dron.battery).toBe(20); // consumo = exactamente 20%
    });

    test('REGRESIÓN 2 (Bug de Estado Fantasma): tras el despacho, el estado queda bloqueado para nuevos envíos', () => {
        DroneService.dispatch('D-01', 1);

        // Si el bug de "estado nunca actualizado" regresara, esto NO lanzaría error
        // y permitiría asignaciones múltiples simultáneas al mismo dron.
        expect(() => DroneService.dispatch('D-01', 1)).toThrow('Dron no disponible');
    });
});
