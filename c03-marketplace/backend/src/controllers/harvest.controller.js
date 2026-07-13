const Harvest = require('../models/harvest.model');
const Farmer = require("../models/farmer.model");
const { flService } = require("../services");

// Add Harvest
const addHarvest = async (req, res) => {

    try {

        const farmer = await Farmer.findById(req.body.farmerId);

        if (!farmer) {

            return res.status(404).json({
                success:false,
                message:"Farmer not found"
            });

        }

        const prediction = await flService.predictPrice({

            district: farmer.district,

            paddyType: req.body.paddyType,

            season: req.body.season,

            quantity: req.body.quantity

        });

        const harvest = await Harvest.create({

            farmerId: req.body.farmerId,

            paddyType: req.body.paddyType,

            quantity: req.body.quantity,

            expectedPrice: req.body.expectedPrice,

            aiPredictedPrice: prediction.predictedPrice

        });

        res.status(201).json({

            success:true,

            data:{

                harvest,

                aiSuggestedPrice: prediction.predictedPrice

            }

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

module.exports={
    addHarvest
};