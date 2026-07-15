const MillerDemand = require('../models/millerDemand.model');

const createDemand = async (req, res) => {
    try {
        const demand = await MillerDemand.create(req.body);

        res.status(201).json({
            success: true,
            data: demand
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

module.exports = {
    createDemand
};