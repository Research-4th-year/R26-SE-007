const Miller = require('../models/miller.model');

//Miller registration controller
const registerMiller = async (req, res) => {
    try {
        const miller = await Miller.create(req.body);

        res.status(201).json({
            success: true,
            data: miller
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerMiller
};