const mongoose = require("mongoose");

const Farmer = require("../models/farmer.model");
const Miller = require("../models/miller.model");
const Harvest = require("../models/harvest.model");
const MillerDemand = require("../models/millerDemand.model");
const MatchSelection = require("../models/matchSelection.model");
const Notification = require("../models/notification.model");

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};


// ======================================================
// FARMER DASHBOARD
// GET /api/dashboard/farmer/:farmerId
// ======================================================

const getFarmerDashboard = async (req, res) => {
    try {
        const { farmerId } = req.params;

        if (!isValidObjectId(farmerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid farmer ID."
            });
        }

        const farmer = await Farmer.findById(farmerId);

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found."
            });
        }

        // Harvest statistics
        const [
            totalHarvests,
            availableHarvests,
            matchedHarvests,
            soldHarvests,
            cancelledHarvests
        ] = await Promise.all([
            Harvest.countDocuments({ farmerId }),
            Harvest.countDocuments({
                farmerId,
                status: "available"
            }),
            Harvest.countDocuments({
                farmerId,
                status: "matched"
            }),
            Harvest.countDocuments({
                farmerId,
                status: "sold"
            }),
            Harvest.countDocuments({
                farmerId,
                status: "cancelled"
            })
        ]);

        // Farmer selection statistics
        const [
            pendingSelections,
            negotiationReadySelections,
            rejectedSelections
        ] = await Promise.all([
            MatchSelection.countDocuments({
                farmerId,
                status: "pending"
            }),
            MatchSelection.countDocuments({
                farmerId,
                status: "negotiation_ready"
            }),
            MatchSelection.countDocuments({
                farmerId,
                status: "rejected"
            })
        ]);

        // Notification statistics
        const unreadNotifications =
            await Notification.countDocuments({
                recipientType: "farmer",
                recipientId: farmerId,
                isRead: false
            });

        // Harvest averages
        const harvestAnalytics = await Harvest.aggregate([
            {
                $match: {
                    farmerId: new mongoose.Types.ObjectId(
                        farmerId
                    )
                }
            },
            {
                $group: {
                    _id: null,

                    averageExpectedPrice: {
                        $avg: "$expectedPrice"
                    },

                    averageAiPredictedPrice: {
                        $avg: "$aiPredictedPrice"
                    },

                    averageHarvestScore: {
                        $avg: "$harvestScore"
                    },

                    totalQuantity: {
                        $sum: "$quantity"
                    }
                }
            }
        ]);

        const analytics = harvestAnalytics[0] || {
            averageExpectedPrice: 0,
            averageAiPredictedPrice: 0,
            averageHarvestScore: 0,
            totalQuantity: 0
        };

        // Recent harvests
        const recentHarvests = await Harvest.find({
            farmerId
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Recent selections
        const recentSelections =
            await MatchSelection.find({
                farmerId
            })
                .populate(
                    "millerId",
                    "name mill_name district location"
                )
                .populate(
                    "demandId",
                    "paddyType quantityNeeded offeredPrice status"
                )
                .populate(
                    "harvestId",
                    "paddyType quantity expectedPrice aiPredictedPrice status"
                )
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

        // Recent notifications
        const recentNotifications =
            await Notification.find({
                recipientType: "farmer",
                recipientId: farmerId
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

        // Latest AI recommendation
        const latestAiHarvest = await Harvest.findOne({
            farmerId
        })
            .sort({ createdAt: -1 })
            .select(
                "paddyType aiPredictedPrice expectedPrice harvestScore marketStatus recommendedAction recommendation createdAt"
            )
            .lean();

        return res.status(200).json({
            success: true,

            data: {
                farmer: {
                    id: farmer._id,
                    farmerName: farmer.farmerName,
                    district: farmer.district,
                    location: farmer.location
                },

                summary: {
                    totalHarvests,
                    availableHarvests,
                    matchedHarvests,
                    soldHarvests,
                    cancelledHarvests,

                    pendingSelections,
                    negotiationReadySelections,
                    rejectedSelections,

                    unreadNotifications
                },

                marketAnalytics: {
                    totalQuantity: Number(
                        analytics.totalQuantity || 0
                    ),

                    averageExpectedPrice: Number(
                        (
                            analytics.averageExpectedPrice || 0
                        ).toFixed(2)
                    ),

                    averageAiPredictedPrice: Number(
                        (
                            analytics.averageAiPredictedPrice ||
                            0
                        ).toFixed(2)
                    ),

                    averageHarvestScore: Number(
                        (
                            analytics.averageHarvestScore || 0
                        ).toFixed(2)
                    )
                },

                latestAiRecommendation:
                    latestAiHarvest,

                recentHarvests,
                recentSelections,
                recentNotifications
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// MILLER DASHBOARD
// GET /api/dashboard/miller/:millerId
// ======================================================

const getMillerDashboard = async (req, res) => {
    try {
        const { millerId } = req.params;

        if (!isValidObjectId(millerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid miller ID."
            });
        }

        const miller = await Miller.findById(millerId);

        if (!miller) {
            return res.status(404).json({
                success: false,
                message: "Miller not found."
            });
        }

        // Demand statistics
        const [
            totalDemands,
            openDemands,
            closedDemands
        ] = await Promise.all([
            MillerDemand.countDocuments({ millerId }),
            MillerDemand.countDocuments({
                millerId,
                status: "open"
            }),
            MillerDemand.countDocuments({
                millerId,
                status: { $ne: "open" }
            })
        ]);

        // Selection statistics
        const [
            pendingSelections,
            negotiationReadySelections,
            rejectedSelections
        ] = await Promise.all([
            MatchSelection.countDocuments({
                millerId,
                status: "pending"
            }),
            MatchSelection.countDocuments({
                millerId,
                status: "negotiation_ready"
            }),
            MatchSelection.countDocuments({
                millerId,
                status: "rejected"
            })
        ]);

        // Notifications
        const unreadNotifications =
            await Notification.countDocuments({
                recipientType: "miller",
                recipientId: millerId,
                isRead: false
            });

        // Demand analytics
        const demandAnalytics =
            await MillerDemand.aggregate([
                {
                    $match: {
                        millerId:
                            new mongoose.Types.ObjectId(
                                millerId
                            )
                    }
                },
                {
                    $group: {
                        _id: null,

                        totalQuantityNeeded: {
                            $sum: "$quantityNeeded"
                        },

                        averageOfferedPrice: {
                            $avg: "$offeredPrice"
                        }
                    }
                }
            ]);

        const analytics = demandAnalytics[0] || {
            totalQuantityNeeded: 0,
            averageOfferedPrice: 0
        };

        // Recent demands
        const recentDemands =
            await MillerDemand.find({
                millerId
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

        // Recent farmer selections received
        const recentSelections =
            await MatchSelection.find({
                millerId
            })
                .populate(
                    "farmerId",
                    "farmerName district location"
                )
                .populate(
                    "harvestId",
                    "paddyType season quantity expectedPrice aiPredictedPrice harvestScore marketStatus status"
                )
                .populate(
                    "demandId",
                    "paddyType quantityNeeded offeredPrice status"
                )
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

        // Recent notifications
        const recentNotifications =
            await Notification.find({
                recipientType: "miller",
                recipientId: millerId
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

        // Best pending farmer matches
        const recommendedFarmerMatches =
            await MatchSelection.find({
                millerId,
                status: "pending"
            })
                .populate(
                    "farmerId",
                    "farmerName district location"
                )
                .populate(
                    "harvestId",
                    "paddyType quantity expectedPrice aiPredictedPrice harvestScore marketStatus status"
                )
                .populate(
                    "demandId",
                    "paddyType quantityNeeded offeredPrice status"
                )
                .sort({ matchingScore: -1 })
                .limit(5)
                .lean();

        return res.status(200).json({
            success: true,

            data: {
                miller: {
                    id: miller._id,
                    name: miller.name,
                    millName: miller.mill_name,
                    district: miller.district,
                    location: miller.location
                },

                summary: {
                    totalDemands,
                    openDemands,
                    closedDemands,

                    pendingSelections,
                    negotiationReadySelections,
                    rejectedSelections,

                    unreadNotifications
                },

                marketAnalytics: {
                    totalQuantityNeeded: Number(
                        analytics.totalQuantityNeeded ||
                            0
                    ),

                    averageOfferedPrice: Number(
                        (
                            analytics.averageOfferedPrice ||
                            0
                        ).toFixed(2)
                    )
                },

                recommendedFarmerMatches,
                recentDemands,
                recentSelections,
                recentNotifications
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getFarmerDashboard,
    getMillerDashboard
};