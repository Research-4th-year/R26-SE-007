const mongoose = require("mongoose");

const Harvest = require(
  "../models/harvest.model"
);
const Farmer = require(
  "../models/farmer.model"
);
const Miller = require(
  "../models/miller.model"
);
const MillerDemand = require(
  "../models/millerDemand.model"
);
const MatchSelection = require(
  "../models/matchSelection.model"
);

const {
  evaluateDemand,
} = require(
  "./matching.controller"
);

const normalizeText = (value = "") => {
  return String(value)
    .trim()
    .toLowerCase();
};

/**
 * POST /api/match-selections/create
 *
 * Farmer selects one or more ranked Miller demands.
 *
 * Body:
 * {
 *   "harvestId": "...",
 *   "demandIds": ["...", "..."]
 * }
 */
const createSelections = async (
  req,
  res
) => {
  try {
    const {
      harvestId,
      demandIds,
    } = req.body;

    if (
      !harvestId ||
      !mongoose.Types.ObjectId.isValid(
        harvestId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid harvest ID is required.",
      });
    }

    if (
      !Array.isArray(demandIds) ||
      demandIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select at least one Miller demand.",
      });
    }

    // Limit selection count to the five matches displayed
    if (demandIds.length > 5) {
      return res.status(400).json({
        success: false,
        message:
          "A maximum of five Miller demands can be selected.",
      });
    }

    const invalidDemandId =
      demandIds.find(
        (id) =>
          !mongoose.Types.ObjectId.isValid(
            id
          )
      );

    if (invalidDemandId) {
      return res.status(400).json({
        success: false,
        message:
          "One or more demand IDs are invalid.",
      });
    }

    const uniqueDemandIds = [
      ...new Set(
        demandIds.map((id) =>
          String(id)
        )
      ),
    ];

    // 1. Find harvest
    const harvest = await Harvest.findById(
      harvestId
    );

    if (!harvest) {
      return res.status(404).json({
        success: false,
        message: "Harvest not found.",
      });
    }

    if (harvest.status !== "available") {
      return res.status(400).json({
        success: false,
        message:
          "Only available harvests can be submitted for matching.",
      });
    }

    // 2. Confirm that the authenticated Farmer owns it
    const farmer = await Farmer.findOne({
      _id: harvest.farmerId,
      user: req.user._id,
    });

    if (!farmer) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to select matches for this harvest.",
      });
    }

    // 3. Get selected open demands and populate Millers
    const demands =
      await MillerDemand.find({
        _id: {
          $in: uniqueDemandIds,
        },

        status: "open",
      }).populate({
        path: "millerId",
        select:
          "name millName district location businessRegistrationNumber purchasingCapacityKg",
      });

    const demandMap = new Map(
      demands.map((demand) => [
        String(demand._id),
        demand,
      ])
    );

    const createdSelections = [];
    const skippedSelections = [];

    // 4. Validate and create every selection
    for (
      const demandId of
      uniqueDemandIds
    ) {
      const demand =
        demandMap.get(demandId);

      if (!demand) {
        skippedSelections.push({
          demandId,
          reason:
            "Demand was not found or is no longer open.",
        });

        continue;
      }

      if (!demand.millerId) {
        skippedSelections.push({
          demandId,
          reason:
            "The linked Miller profile was not found.",
        });

        continue;
      }

      // Prevent submitting a different paddy type
      if (
        normalizeText(
          demand.paddyType
        ) !==
        normalizeText(
          harvest.paddyType
        )
      ) {
        skippedSelections.push({
          demandId,
          reason:
            "The demand paddy type does not match the harvest.",
        });

        continue;
      }

      // Do not trust matching scores sent by the frontend.
      // Calculate it again using backend data.
      const evaluation =
        evaluateDemand({
          demand,
          harvest,
          farmer,
        });

      try {
        const selection =
          await MatchSelection.create({
            harvestId: harvest._id,
            farmerId: farmer._id,

            millerId:
              demand.millerId._id,

            demandId: demand._id,

            matchingScore:
              evaluation.matchingPercentage,

            status: "pending",

            farmerSelectedAt:
              new Date(),
          });

        const populatedSelection =
          await MatchSelection.findById(
            selection._id
          )
            .populate("harvestId")
            .populate({
              path: "farmerId",
              select:
                "farmerName district location",
            })
            .populate({
              path: "millerId",
              select:
                "name millName district location",
            })
            .populate("demandId");

        createdSelections.push(
          populatedSelection
        );
      } catch (error) {
        // Duplicate unique harvest-demand pair
        if (error.code === 11000) {
          skippedSelections.push({
            demandId,
            reason:
              "This harvest-demand match was already selected.",
          });

          continue;
        }

        throw error;
      }
    }

    if (
      createdSelections.length === 0
    ) {
      return res.status(409).json({
        success: false,

        message:
          "No new matching requests were created.",

        data: {
          harvestId:
            String(harvest._id),

          createdCount: 0,

          skippedCount:
            skippedSelections.length,

          selections: [],

          skippedSelections,
        },
      });
    }

    return res.status(201).json({
      success: true,

      message:
        "Matching requests were sent successfully.",

      data: {
        harvestId:
          String(harvest._id),

        createdCount:
          createdSelections.length,

        skippedCount:
          skippedSelections.length,

        selections:
          createdSelections,

        skippedSelections,
      },
    });
  } catch (error) {
    console.error(
      "CREATE MATCH SELECTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to create matching selections.",
    });
  }
};

/**
 * PATCH /api/match-selections/:selectionId/respond
 *
 * Miller accepts or rejects a Farmer's matching request.
 *
 * Body:
 * {
 *   "decision": "accepted"
 * }
 *
 * or
 *
 * {
 *   "decision": "rejected"
 * }
 */
const respondToSelection = async (
  req,
  res
) => {
  try {
    const { selectionId } =
      req.params;

    const { decision } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(
        selectionId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid match selection ID.",
      });
    }

    if (
      !["accepted", "rejected"].includes(
        decision
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be either accepted or rejected.",
      });
    }

    // 1. Find authenticated Miller profile
    const miller = await Miller.findOne({
      user: req.user._id,
    });

    if (!miller) {
      return res.status(404).json({
        success: false,
        message:
          "Miller profile not found.",
      });
    }

    // 2. Find selection belonging to this Miller
    const selection =
      await MatchSelection.findOne({
        _id: selectionId,
        millerId: miller._id,
      })
        .populate("harvestId")
        .populate({
          path: "farmerId",
          select:
            "farmerName district location",
        })
        .populate({
          path: "millerId",
          select:
            "name millName district location",
        })
        .populate("demandId");

    if (!selection) {
      return res.status(404).json({
        success: false,
        message:
          "Matching request was not found or does not belong to this Miller.",
      });
    }

    if (
      selection.status !== "pending"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This matching request has already been processed.",
      });
    }

    if (decision === "accepted") {
      // Ensure the linked records are still available
      if (
        !selection.harvestId ||
        selection.harvestId.status !==
          "available"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "The selected harvest is no longer available.",
        });
      }

      if (
        !selection.demandId ||
        selection.demandId.status !==
          "open"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "The selected demand is no longer open.",
        });
      }

      selection.status =
        "negotiation_ready";

      selection.millerRespondedAt =
        new Date();

      await selection.save();

      // Reserve the demand for this accepted match
      await MillerDemand.findByIdAndUpdate(
        selection.demandId._id,
        {
          status:
            "negotiation_ready",
        },
        {
          runValidators: true,
        }
      );

      // Mark harvest as matched
      await Harvest.findByIdAndUpdate(
        selection.harvestId._id,
        {
          status: "matched",
        },
        {
          runValidators: true,
        }
      );

      // Other pending requests for the same demand can no
      // longer use this demand.
      await MatchSelection.updateMany(
        {
          demandId:
            selection.demandId._id,

          _id: {
            $ne: selection._id,
          },

          status: "pending",
        },
        {
          status: "cancelled",
          millerRespondedAt:
            new Date(),
        }
      );

      const updatedSelection =
        await MatchSelection.findById(
          selection._id
        )
          .populate("harvestId")
          .populate({
            path: "farmerId",
            select:
              "farmerName district location",
          })
          .populate({
            path: "millerId",
            select:
              "name millName district location",
          })
          .populate("demandId");

      return res.status(200).json({
        success: true,

        message:
          "Match accepted. The Farmer and Miller can now proceed to AI negotiation.",

        data: {
          selection:
            updatedSelection,
        },
      });
    }

    // Rejection flow
    selection.status = "rejected";

    selection.millerRespondedAt =
      new Date();

    await selection.save();

    const updatedSelection =
      await MatchSelection.findById(
        selection._id
      )
        .populate("harvestId")
        .populate({
          path: "farmerId",
          select:
            "farmerName district location",
        })
        .populate({
          path: "millerId",
          select:
            "name millName district location",
        })
        .populate("demandId");

    return res.status(200).json({
      success: true,

      message:
        "Matching request rejected.",

      data: {
        selection:
          updatedSelection,
      },
    });
  } catch (error) {
    console.error(
      "RESPOND TO MATCH ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to process the matching request.",
    });
  }
};

/**
 * GET /api/match-selections/miller
 *
 * Returns selections received by the authenticated Miller.
 */
const getMillerSelections = async (
  req,
  res
) => {
  try {
    const miller = await Miller.findOne({
      user: req.user._id,
    });

    if (!miller) {
      return res.status(404).json({
        success: false,
        message:
          "Miller profile not found.",
      });
    }

    const selections =
      await MatchSelection.find({
        millerId: miller._id,
      })
        .populate("harvestId")
        .populate({
          path: "farmerId",
          select:
            "farmerName district location",
        })
        .populate({
          path: "demandId",
        })
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: selections.length,
      data: selections,
    });
  } catch (error) {
    console.error(
      "GET MILLER SELECTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to retrieve Miller selections.",
    });
  }
};

/**
 * GET /api/match-selections/farmer
 *
 * Returns selections submitted by the authenticated Farmer.
 */
const getFarmerSelections = async (
  req,
  res
) => {
  try {
    const farmer = await Farmer.findOne({
      user: req.user._id,
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message:
          "Farmer profile not found.",
      });
    }

    const selections =
      await MatchSelection.find({
        farmerId: farmer._id,
      })
        .populate("harvestId")
        .populate({
          path: "millerId",
          select:
            "name millName district location businessRegistrationNumber purchasingCapacityKg",
        })
        .populate("demandId")
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: selections.length,
      data: selections,
    });
  } catch (error) {
    console.error(
      "GET FARMER SELECTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to retrieve Farmer selections.",
    });
  }
};

module.exports = {
  createSelections,
  respondToSelection,
  getMillerSelections,
  getFarmerSelections,
};