const Farmer = require('../models/farmer.model');

// Register Farmer
const registerFarmer = async (req, res) => {
    try {
        const farmer = await Farmer.create(req.body);

        res.status(201).json({
            success: true,
            data: farmer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerFarmer
};