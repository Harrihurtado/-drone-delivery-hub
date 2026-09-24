// Simula una "base de datos" en memoria.
// Usamos "let" (no const) para poder reasignar el array completo desde reset(),
// lo que nos permite dejar la BD en un estado limpio y predecible antes de cada prueba.
let drones = [
    { id: 'D-01', battery: 100, status: 'idle' },
    { id: 'D-02', battery: 15, status: 'idle' }
];

const DroneModel = {
    // Devuelve TODOS los drones, sin filtrar (útil para depuración / pruebas)
    getAll: () => drones,

    // Devuelve solo los drones disponibles para una misión
    getAvailable: () => drones.filter(d => d.status === 'idle'),

    // Búsqueda por id (usada tanto por el service como por los tests bottom-up)
    findById: (id) => drones.find(d => d.id === id),

    // Permite a los tests reiniciar la "base de datos" en memoria a un estado conocido,
    // evitando que un test contamine el estado de otro (aislamiento entre pruebas).
    reset: (newDrones) => {
        drones = newDrones;
    }
};

module.exports = DroneModel;
