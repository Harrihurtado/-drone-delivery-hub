const DroneModel = require('../../src/models/droneModel');

describe('DroneModel - Pruebas Unitarias', () => {

    beforeEach(() => {
        // Reiniciamos la "BD" en memoria antes de cada test para que no
        // dependan del orden de ejecución ni de mutaciones de otros tests.
        DroneModel.reset([
            { id: 'D-01', battery: 100, status: 'idle' },
            { id: 'D-02', battery: 15, status: 'idle' },
            { id: 'D-03', battery: 50, status: 'en-vuelo' }
        ]);
    });

    test('1. getAvailable retorna únicamente los drones con status "idle"', () => {
        const disponibles = DroneModel.getAvailable();
        expect(disponibles).toHaveLength(2);
        expect(disponibles.every(d => d.status === 'idle')).toBe(true);
    });

    test('2. getAvailable excluye explícitamente a los drones "en-vuelo"', () => {
        const disponibles = DroneModel.getAvailable();
        expect(disponibles.find(d => d.id === 'D-03')).toBeUndefined();
    });

    test('3. findById retorna el dron correcto cuando el id existe', () => {
        const dron = DroneModel.findById('D-02');
        expect(dron).toEqual({ id: 'D-02', battery: 15, status: 'idle' });
    });

    test('4. findById retorna undefined cuando el id no existe', () => {
        const dron = DroneModel.findById('D-99');
        expect(dron).toBeUndefined();
    });
});
