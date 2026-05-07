const Harvest = require('../models/harvest.model');

// Add Harvest
const addHarvest = async (req, res) => {
    try {
        const harvest = await Harvest.create(req.body);

        res.status(201).json({
            success: true,
            data: harvest
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addHarvest
};