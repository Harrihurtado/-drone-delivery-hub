// BOTTOM-UP: partimos de la capa más baja (acceso a datos) con su
// implementación REAL, la integramos con el Service real, y subimos hasta
// invocar el Controlador directamente (sin pasar por el servidor HTTP,
// usando objetos req/res simulados a mano).
const DroneModel = require('../../src/models/droneModel');
const DroneService = require('../../src/services/droneService');
const DroneController = require('../../src/controllers/droneController');

describe('Integración Bottom-Up: Modelo -> Service -> Controlador (sin mocks)', () => {

    beforeEach(() => {
        DroneModel.reset([
            { id: 'D-01', battery: 100, status: 'idle' },
            { id: 'D-02', battery: 15, status: 'idle' }
        ]);
    });

    test('1. DroneModel + DroneService reales: dispatch muta el dron real dentro del modelo', () => {
        const resultado = DroneService.dispatch('D-01', 10);
        const desdeModelo = DroneModel.findById('D-01');

        expect(resultado).toBe(desdeModelo);
        expect(desdeModelo.battery).toBe(80);
        expect(desdeModelo.status).toBe('en-vuelo');
    });

    test('2. DroneModel.getAvailable refleja el cambio de estado provocado por DroneService.dispatch', () => {
        DroneService.dispatch('D-01', 5);

        const disponibles = DroneModel.getAvailable();
        expect(disponibles.find(d => d.id === 'D-01')).toBeUndefined();
        expect(disponibles.find(d => d.id === 'D-02')).toBeDefined();
    });

    test('3. El Controlador, con Modelo y Service reales, responde correctamente vía req/res simulados', () => {
        const req = { body: { droneId: 'D-02', distance: 5 } };
        const res = {
            statusCode: null,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(payload) { this.body = payload; return this; }
        };

        DroneController.dispatchDrone(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.battery).toBe(5); // 15 - (5 * 2)
        expect(res.body.status).toBe('en-vuelo');
    });
});
