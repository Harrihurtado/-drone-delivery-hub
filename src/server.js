// Este archivo es el que se usa SOLO para correr el servidor de verdad
// (con Postman o el navegador). app.js se deja limpio, sin app.listen(),
// para que Jest/Supertest lo puedan importar en las pruebas sin que se
// quede un puerto abierto en segundo plano durante "npm test".
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚁 Drone Delivery Hub corriendo en http://localhost:${PORT}`);
    console.log('Endpoints disponibles:');
    console.log(`  GET  http://localhost:${PORT}/api/drones`);
    console.log(`  GET  http://localhost:${PORT}/api/drones/all`);
    console.log(`  POST http://localhost:${PORT}/api/dispatch`);
});
