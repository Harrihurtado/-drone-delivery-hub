// TOP-DOWN: partimos de la capa más alta (rutas HTTP) y bajamos.
// Simulamos (mockeamos) las capas inferiores -Service y Model- para
// verificar SOLO que la ruta y el controlador cablean bien las peticiones,
// sin depender de que la lógica de negocio real esté implementada todavía.
jest.mock('../../src/services/droneService');
jest.mock('../../src/models/droneModel');

const request = require('supertest');
const app = require('../../src/app');
const DroneService = require('../../src/services/droneService');
const DroneModel = require('../../src/models/droneModel');

describe('Integración Top-Down: Rutas -> Controlador (Service y Model mockeados)', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('1. POST /api/dispatch responde 200 y el dron cuando el service resuelve exitosamente', async () => {
        DroneService.dispatch.mockReturnValue({ id: 'D-01', battery: 80, status: 'en-vuelo' });

        const res = await request(app)
            .post('/api/dispatch')
            .send({ droneId: 'D-01', distance: 10 });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('en-vuelo');
        expect(DroneService.dispatch).toHaveBeenCalledWith('D-01', 10);
    });

    test('2. POST /api/dispatch responde 400 cuando el service lanza un error de negocio', async () => {
        DroneService.dispatch.mockImplementation(() => {
            throw new Error('Batería insuficiente');
        });

        const res = await request(app)
            .post('/api/dispatch')
            .send({ droneId: 'D-02', distance: 50 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Batería insuficiente');
    });

    test('3. GET /api/drones responde 200 con exactamente lo que retorna DroneModel (mock)', async () => {
        DroneModel.getAvailable.mockReturnValue([{ id: 'D-99', battery: 50, status: 'idle' }]);

        const res = await request(app).get('/api/drones');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 'D-99', battery: 50, status: 'idle' }]);
    });
});
