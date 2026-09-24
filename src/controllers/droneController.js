const DroneModel = require('../models/droneModel');
const DroneService = require('../services/droneService');

const DroneController = {
    getDrones: (req, res) => {
        res.status(200).json(DroneModel.getAvailable());
    },

    getAllDrones: (req, res) => {
        res.status(200).json(DroneModel.getAll());
    },

    dispatchDrone: (req, res) => {
        try {
            const { droneId, distance } = req.body;
            const result = DroneService.dispatch(droneId, distance);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = DroneController;
