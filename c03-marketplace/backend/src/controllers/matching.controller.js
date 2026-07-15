const Harvest = require('../models/harvest.model');
const MillerDemand = require('../models/millerDemand.model');
const Farmer = require('../models/farmer.model');

// Matching Algorithm
const matchHarvest = async (req, res) => {
    try {
        const { harvestId } = req.params;

        // 1. Get harvest
        const harvest = await Harvest.findById(harvestId);

        if (!harvest) {
            return res.status(404).json({ error: "Harvest not found" });
        }

        // 2. Get farmer (for location)
        const farmer = await Farmer.findById(harvest.farmerId);

        if (!farmer) {
            return res.status(404).json({ error: "Farmer not found" });
        }

        // 3. Get all active demands
        const demands = await MillerDemand.find({
            status: "open",
            paddyType: harvest.paddyType
        }).populate("millerId");



        // 4. SCORING FUNCTION
        const calculateScore = (demand) => {
            let score = 0;

            const miller = demand.millerId;

            // 🔹 1. Location Match (40)
            if (
                miller.district.trim().toLowerCase() ===
                farmer.district.trim().toLowerCase()
            ) {
                score += 40;
            }

            // 🔹 2. Paddy Type Match (30)
            if (
                demand.paddyType.toLowerCase() ===
                harvest.paddyType.toLowerCase()
            ) {
                score += 30;
            }

            // 🔹 3. Price Match (20)
            if (harvest.expectedPrice <= demand.offeredPrice) {
                score += 20;
            }

            // 🔹 4. Quantity Match (10)
            if (harvest.quantity <= demand.quantityNeeded) {
                score += 10;
            }

            return score;
        };

        // 5. Compute matches
        const matched = demands.map(d => ({
            demand: d,
            miller: d.millerId,
            score: calculateScore(d)
        }));

        // 6. Sort
        matched.sort((a, b) => b.score - a.score);

        // 7. Response
        res.status(200).json({
            success: true,
            harvest,
            matches: matched.slice(0, 5)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    matchHarvest
};