const Harvest = require("../models/harvest.model");
const Farmer = require("../models/farmer.model");
const MillerDemand = require("../models/millerDemand.model");
const MatchSelection = require("../models/matchSelection.model");
const Notification = require("../models/notification.model");

const normalizeText = (value = "") => {
    return value.trim().toLowerCase();
};

// Calculate the same explainable matching score
const calculateMatchingScore = ({
    harvest,
    farmer,
    demand
}) => {
    const miller = demand.millerId;

    let score = 0;

    // 1. District match — 40
    if (
        normalizeText(miller.district) ===
        normalizeText(farmer.district)
    ) {
        score += 40;
    }

    // 2. Paddy type match — 30
    if (
        normalizeText(demand.paddyType) ===
        normalizeText(harvest.paddyType)
    ) {
        score += 30;
    }

    // 3. FL price compatibility — 20
    const referencePrice =
        Number(harvest.aiPredictedPrice) ||
        Number(harvest.expectedPrice);

    const offeredPrice = Number(demand.offeredPrice);

    const priceDifference = Math.abs(
        referencePrice - offeredPrice
    );

    if (priceDifference <= 5) {
        score += 20;
    } else if (priceDifference <= 10) {
        score += 15;
    } else if (priceDifference <= 20) {
        score += 10;
    } else {
        score += 5;
    }

    // 4. Quantity compatibility — 10
    if (
        Number(harvest.quantity) <=
        Number(demand.quantityNeeded)
    ) {
        score += 10;
    }

    return score;
};

// Farmer selects one or more miller demands
const createSelections = async (req, res) => {
    try {
        const {
            harvestId,
            demandIds
        } = req.body;

        if (
            !Array.isArray(demandIds) ||
            demandIds.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one demand ID is required."
            });
        }

        // 1. Find harvest
        const harvest = await Harvest.findById(harvestId);

        if (!harvest) {
            return res.status(404).json({
                success: false,
                message: "Harvest not found."
            });
        }

        if (harvest.status !== "available") {
            return res.status(400).json({
                success: false,
                message:
                    "Only available harvests can be sent to millers."
            });
        }

        // 2. Find farmer
        const farmer = await Farmer.findById(
            harvest.farmerId
        );

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found."
            });
        }

        // 3. Get selected open demands
        const demands = await MillerDemand.find({
            _id: {
                $in: demandIds
            },
            status: "open"
        }).populate("millerId");

        const validDemands = demands.filter(
            (demand) => demand.millerId
        );

        if (validDemands.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No valid open miller demands were found."
            });
        }

        const createdSelections = [];
        const skippedSelections = [];

        // 4. Create each selection
        for (const demand of validDemands) {
            const existingSelection =
                await MatchSelection.findOne({
                    harvestId: harvest._id,
                    demandId: demand._id
                });

            if (existingSelection) {
                skippedSelections.push({
                    demandId: demand._id,
                    reason:
                        "This demand was already selected."
                });

                continue;
            }

            const matchingScore =
                calculateMatchingScore({
                    harvest,
                    farmer,
                    demand
                });

            const selection =
                await MatchSelection.create({
                    harvestId: harvest._id,
                    farmerId: farmer._id,
                    millerId: demand.millerId._id,
                    demandId: demand._id,
                    matchingScore,
                    status: "pending"
                });

            // 5. Create notification for the miller
            await Notification.create({
                recipientType: "miller",
                recipientId: demand.millerId._id,

                type: "MATCH_SELECTED",

                title: {
                    english: "New Farmer Match",
                    sinhala: "නව ගොවි ගැළපීමක්"
                },

                message: {
                    english:
                        `${farmer.farmerName} selected your demand for ` +
                        `${harvest.paddyType}. Matching score: ` +
                        `${matchingScore}%.`,

                    sinhala:
                        `${farmer.farmerName} විසින් ඔබගේ ` +
                        `${harvest.paddyType} වී ඉල්ලුම තෝරාගෙන ඇත. ` +
                        `ගැළපීමේ ලකුණු ප්‍රතිශතය ${matchingScore}% කි.`
                },

                relatedHarvestId: harvest._id,
                relatedSelectionId: selection._id
            });

            createdSelections.push(selection);
        }

        return res.status(201).json({
            success: true,

            message:
                "Miller selections created successfully.",

            data: {
                harvestId: harvest._id,
                createdCount: createdSelections.length,
                skippedCount: skippedSelections.length,
                selections: createdSelections,
                skippedSelections
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Miller accepts or rejects a selection
const respondToSelection = async (req, res) => {
    try {
        const { selectionId } = req.params;

        const {
            millerId,
            decision
        } = req.body;

        const normalizedDecision = String(
            decision
        ).trim().toLowerCase();

        if (
            !["accepted", "rejected"].includes(
                normalizedDecision
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Decision must be accepted or rejected."
            });
        }

        // 1. Find selection
        const selection =
            await MatchSelection.findById(
                selectionId
            )
                .populate("harvestId")
                .populate("farmerId")
                .populate("millerId")
                .populate("demandId");

        if (!selection) {
            return res.status(404).json({
                success: false,
                message: "Match selection not found."
            });
        }

        // 2. Ensure correct miller responds
        if (
            selection.millerId._id.toString() !==
            millerId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to respond to this selection."
            });
        }

        if (selection.status !== "pending") {
            return res.status(400).json({
                success: false,
                message:
                    "This selection has already been processed."
            });
        }

        selection.millerRespondedAt = new Date();

        // 3. Miller accepts
        if (normalizedDecision === "accepted") {
            selection.status =
                "negotiation_ready";

            await selection.save();

            // Mark harvest as matched
            await Harvest.findByIdAndUpdate(
                selection.harvestId._id,
                {
                    status: "matched"
                }
            );

            // Notify farmer
            await Notification.create({
                recipientType: "farmer",
                recipientId:
                    selection.farmerId._id,

                type: "NEGOTIATION_READY",

                title: {
                    english: "Miller Accepted Match",
                    sinhala:
                        "වී මෝල්කරු ගැළපීම පිළිගෙන ඇත"
                },

                message: {
                    english:
                        `${selection.millerId.name} from ` +
                        `${selection.millerId.mill_name} accepted ` +
                        `your matching request. The connection is ` +
                        `ready for negotiation.`,

                    sinhala:
                        `${selection.millerId.mill_name} ආයතනයේ ` +
                        `${selection.millerId.name} විසින් ඔබගේ ` +
                        `ගැළපීමේ ඉල්ලීම පිළිගෙන ඇත. මෙම සම්බන්ධතාවය ` +
                        `මිල සාකච්ඡාව සඳහා සූදානම්ය.`
                },

                relatedHarvestId:
                    selection.harvestId._id,

                relatedSelectionId:
                    selection._id
            });

            return res.status(200).json({
                success: true,

                message:
                    "Selection accepted and marked as negotiation-ready.",

                data: {
                    selection
                }
            });
        }

        // 4. Miller rejects
        selection.status = "rejected";

        await selection.save();

        await Notification.create({
            recipientType: "farmer",
            recipientId: selection.farmerId._id,

            type: "MATCH_REJECTED",

            title: {
                english: "Miller Rejected Match",
                sinhala:
                    "වී මෝල්කරු ගැළපීම ප්‍රතික්ෂේප කර ඇත"
            },

            message: {
                english:
                    `${selection.millerId.name} rejected your ` +
                    `matching request. You may select another ` +
                    `recommended miller.`,

                sinhala:
                    `${selection.millerId.name} විසින් ඔබගේ ` +
                    `ගැළපීමේ ඉල්ලීම ප්‍රතික්ෂේප කර ඇත. ` +
                    `වෙනත් නිර්දේශිත වී මෝල්කරුවෙකු තෝරාගත හැකිය.`
            },

            relatedHarvestId:
                selection.harvestId._id,

            relatedSelectionId:
                selection._id
        });

        return res.status(200).json({
            success: true,

            message:
                "Selection rejected successfully.",

            data: {
                selection
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get selections received by a miller
const getMillerSelections = async (req, res) => {
    try {
        const { millerId } = req.params;

        const selections =
            await MatchSelection.find({
                millerId
            })
                .populate("harvestId")
                .populate("farmerId")
                .populate("demandId")
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: selections.length,
            data: selections
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get selections sent by a farmer
const getFarmerSelections = async (req, res) => {
    try {
        const { farmerId } = req.params;

        const selections =
            await MatchSelection.find({
                farmerId
            })
                .populate("harvestId")
                .populate("millerId")
                .populate("demandId")
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: selections.length,
            data: selections
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createSelections,
    respondToSelection,
    getMillerSelections,
    getFarmerSelections
};