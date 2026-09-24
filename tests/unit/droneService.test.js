// jest.mock() reemplaza automáticamente TODAS las funciones exportadas por
// DroneModel con jest.fn(). Así, DroneService queda totalmente aislado de
// la capa de datos real: es una prueba UNITARIA pura del negocio.
jest.mock('../../src/models/droneModel');

const DroneModel = require('../../src/models/droneModel');
const DroneService = require('../../src/services/droneService');

describe('DroneService - Pruebas Unitarias (DroneModel mockeado)', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('1. calculateRequiredBattery calcula 2% de batería por cada km', () => {
        expect(DroneService.calculateRequiredBattery(10)).toBe(20);
        expect(DroneService.calculateRequiredBattery(0)).toBe(0);
        expect(DroneService.calculateRequiredBattery(2.5)).toBe(5);
    });

    test('2. dispatch lanza "Dron no encontrado" si el id no existe (mock)', () => {
        DroneModel.findById.mockReturnValue(undefined);
        expect(() => DroneService.dispatch('X-00', 5)).toThrow('Dron no encontrado');
    });

    test('3. dispatch lanza "Dron no disponible" si el status no es "idle" (spy)', () => {
        const spy = jest.spyOn(DroneModel, 'findById')
            .mockReturnValue({ id: 'D-05', battery: 100, status: 'en-vuelo' });

        expect(() => DroneService.dispatch('D-05', 5)).toThrow('Dron no disponible');
        expect(spy).toHaveBeenCalledWith('D-05');
    });

    test('4. dispatch lanza "Batería insuficiente" si la batería no alcanza', () => {
        DroneModel.findById.mockReturnValue({ id: 'D-02', battery: 15, status: 'idle' });
        // 10km requieren 20% de batería, el dron solo tiene 15%
        expect(() => DroneService.dispatch('D-02', 10)).toThrow('Batería insuficiente');
    });

    test('5. [BUG 1] dispatch resta el CONSUMO CALCULADO (distancia*2), no la distancia directa', () => {
        const droneMock = { id: 'D-01', battery: 100, status: 'idle' };
        DroneModel.findById.mockReturnValue(droneMock);

        const resultado = DroneService.dispatch('D-01', 10);

        // Si el bug siguiera presente, esto daría 90 (100 - 10)
        expect(resultado.battery).toBe(80); // 100 - (10 * 2)
    });

    test('6. [BUG 2] dispatch actualiza el status a "en-vuelo" tras un despacho exitoso', () => {
        const droneMock = { id: 'D-01', battery: 100, status: 'idle' };
        DroneModel.findById.mockReturnValue(droneMock);

        const resultado = DroneService.dispatch('D-01', 10);

        expect(resultado.status).toBe('en-vuelo');
    });
});
