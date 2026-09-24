// BIG BANG: probamos la API COMPLETA de una sola vez, tal como la usaría un
// cliente real: petición HTTP real contra la app de Express, con el Service
// y el Model reales (sin ningún mock), verificando tanto la respuesta HTTP
// como el estado final de la "base de datos" en memoria.
const request = require('supertest');
const app = require('../../src/app');
const DroneModel = require('../../src/models/droneModel');

describe('Integración Big Bang: API completa end-to-end (HTTP real, sin mocks)', () => {

    beforeEach(() => {
        DroneModel.reset([
            { id: 'D-01', battery: 100, status: 'idle' },
            { id: 'D-02', battery: 15, status: 'idle' }
        ]);
    });

    test('1. POST /api/dispatch despacha un dron real y persiste el cambio en la base de datos', async () => {
        const res = await request(app)
            .post('/api/dispatch')
            .send({ droneId: 'D-01', distance: 20 });

        expect(res.status).toBe(200);
        expect(res.body.battery).toBe(60); // 100 - (20 * 2)
        expect(res.body.status).toBe('en-vuelo');

        const persistido = DroneModel.findById('D-01');
        expect(persistido.battery).toBe(60);
        expect(persistido.status).toBe('en-vuelo');
    });

    test('2. POST /api/dispatch rechaza un segundo despacho del mismo dron ya en vuelo', async () => {
        await request(app).post('/api/dispatch').send({ droneId: 'D-01', distance: 5 });

        const segundoIntento = await request(app)
            .post('/api/dispatch')
            .send({ droneId: 'D-01', distance: 5 });

        expect(segundoIntento.status).toBe(400);
        expect(segundoIntento.body.error).toBe('Dron no disponible');
    });

    test('3. GET /api/drones excluye del listado a los drones en vuelo tras un ciclo completo de despacho', async () => {
        await request(app).post('/api/dispatch').send({ droneId: 'D-02', distance: 5 });

        const res = await request(app).get('/api/drones');

        expect(res.status).toBe(200);
        expect(res.body.find(d => d.id === 'D-02')).toBeUndefined();
        expect(res.body.find(d => d.id === 'D-01')).toBeDefined();
    });
});
