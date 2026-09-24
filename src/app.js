const express = require('express');
const DroneController = require('./controllers/droneController');

const app = express();
app.use(express.json());

app.get('/api/drones', DroneController.getDrones);
app.get('/api/drones/all', DroneController.getAllDrones);
app.post('/api/dispatch', DroneController.dispatchDrone);

module.exports = app;
