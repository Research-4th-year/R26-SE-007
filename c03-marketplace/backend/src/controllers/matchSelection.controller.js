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

const {
  createMarketplaceNotification,
} = require(
  "../services/notification.service"
);

const normalizeText = (
  value = ""
) => {
  return String(value)
    .trim()
    .toLowerCase();
};

const populateSelection =
  async (selectionId) => {
    return MatchSelection
      .findById(selectionId)

      .populate({
        path: "harvestId",
      })

      .populate({
        path: "farmerId",

        select:
          "farmerName district location farmName",
      })

      .populate({
        path: "millerId",

        select:
          "name millName district location businessRegistrationNumber purchasingCapacityKg",
      })

      .populate({
        path: "demandId",
      });
  };

/**
 * FARMER INITIATES
 *
 * POST /api/match-selections/create
 *
 * Body:
 *
 * {
 *   harvestId,
 *   demandIds: []
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
      !Array.isArray(
        demandIds
      ) ||
      demandIds.length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Select at least one Miller demand.",
      });
    }

    if (
      demandIds.length > 5
    ) {
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
        demandIds.map(
          String
        )
      ),
    ];

    const harvest =
      await Harvest.findById(
        harvestId
      );

    if (!harvest) {
      return res.status(404).json({
        success: false,

        message:
          "Harvest not found.",
      });
    }

    if (
      harvest.status !==
      "available"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Only available harvests can be submitted for matching.",
      });
    }

    const farmer =
      await Farmer.findOne({
        _id:
          harvest.farmerId,

        user:
          req.user._id,
      });

    if (!farmer) {
      return res.status(403).json({
        success: false,

        message:
          "You are not authorized to select matches for this harvest.",
      });
    }

    const demands =
      await MillerDemand.find({
        _id: {
          $in:
            uniqueDemandIds,
        },

        status: "open",
      }).populate({
        path:
          "millerId",

        select:
          "name millName district location businessRegistrationNumber purchasingCapacityKg",
      });

    const demandMap =
      new Map(
        demands.map(
          (demand) => [
            String(
              demand._id
            ),

            demand,
          ]
        )
      );

    const createdSelections =
      [];

    const skippedSelections =
      [];

    for (
      const demandId of
      uniqueDemandIds
    ) {
      const demand =
        demandMap.get(
          demandId
        );

      if (!demand) {
        skippedSelections.push({
          demandId,

          reason:
            "Demand was not found or is no longer open.",
        });

        continue;
      }

      if (
        !demand.millerId
      ) {
        skippedSelections.push({
          demandId,

          reason:
            "The linked Miller profile was not found.",
        });

        continue;
      }

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

      const evaluation =
        evaluateDemand({
          demand,
          harvest,
          farmer,
          perspective:
            "farmer",
        });

      try {
        const selection =
          await MatchSelection.create({
            harvestId:
              harvest._id,

            farmerId:
              farmer._id,

            millerId:
              demand.millerId._id,

            demandId:
              demand._id,

            matchingScore:
              evaluation
                .matchingPercentage,

            initiatedBy:
              "farmer",

            status:
              "pending",

            initiatedAt:
              new Date(),
          });

        const populated =
          await populateSelection(
            selection._id
          );

        createdSelections.push(
          populated
        );

          await createMarketplaceNotification({
            recipientType: "farmer",
            recipientId:
              farmer._id,
            actorType: "miller",
            actorId:
              miller._id,
            actorName:
              miller.millName ||
              miller.name,
            type:
              "MATCH_REQUEST",

            titleEnglish:
              "New Miller match request",
            titleSinhala:
              "නව මෝල්කරු ගැළපීමේ ඉල්ලීමක්",

            messageEnglish:
              `${miller.millName || miller.name} sent a match request for your ${harvest.paddyType} harvest.`,
            messageSinhala:
              `${miller.millName || miller.name} විසින් ඔබගේ ${harvest.paddyType} අස්වැන්න සඳහා ගැළපීමේ ඉල්ලීමක් යවා ඇත.`,

            relatedHarvestId:
              harvest._id,
            relatedSelectionId:
              selection._id,
          });

        await createMarketplaceNotification({
          recipientType: "miller",
          recipientId:
            demand.millerId._id,
          actorType: "farmer",
          actorId: farmer._id,
          actorName:
            farmer.farmerName,
          type: "MATCH_REQUEST",

          titleEnglish:
            "New Farmer match request",
          titleSinhala:
            "නව ගොවි ගැළපීමේ ඉල්ලීමක්",

          messageEnglish:
            `${farmer.farmerName} sent a match request for ${harvest.paddyType} paddy.`,
          messageSinhala:
            `${farmer.farmerName} විසින් ${harvest.paddyType} වී සඳහා ගැළපීමේ ඉල්ලීමක් යවා ඇත.`,

          relatedHarvestId:
            harvest._id,
          relatedSelectionId:
            selection._id,
        });
      } catch (error) {
        if (
          error.code ===
          11000
        ) {
          skippedSelections.push({
            demandId,

            reason:
              "A matching request already exists for this Harvest and Demand.",
          });

          continue;
        }

        throw error;
      }
    }

    if (
      createdSelections.length ===
      0
    ) {
      return res.status(409).json({
        success: false,

        message:
          "No new matching requests were created.",

        data: {
          harvestId:
            String(
              harvest._id
            ),

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
        "Matching requests were sent to the selected Millers.",

      data: {
        harvestId:
          String(
            harvest._id
          ),

        initiatedBy:
          "farmer",

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
      "CREATE FARMER MATCH REQUEST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to create Farmer matching requests.",
    });
  }
};

/**
 * MILLER INITIATES
 *
 * POST /api/match-selections/create-by-miller
 *
 * Body:
 *
 * {
 *   demandId,
 *   harvestIds: []
 * }
 */
const createSelectionsByMiller =
  async (req, res) => {
    try {
      const {
        demandId,
        harvestIds,
      } = req.body;

      if (
        !demandId ||
        !mongoose.Types.ObjectId.isValid(
          demandId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "A valid demand ID is required.",
        });
      }

      if (
        !Array.isArray(
          harvestIds
        ) ||
        harvestIds.length ===
          0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Select at least one Farmer harvest.",
        });
      }

      if (
        harvestIds.length > 5
      ) {
        return res.status(400).json({
          success: false,

          message:
            "A maximum of five Farmer harvests can be selected.",
        });
      }

      const invalidHarvestId =
        harvestIds.find(
          (id) =>
            !mongoose.Types.ObjectId.isValid(
              id
            )
        );

      if (invalidHarvestId) {
        return res.status(400).json({
          success: false,

          message:
            "One or more harvest IDs are invalid.",
        });
      }

      const uniqueHarvestIds =
        [
          ...new Set(
            harvestIds.map(
              String
            )
          ),
        ];

      const miller =
        await Miller.findOne({
          user:
            req.user._id,
        });

      if (!miller) {
        return res.status(404).json({
          success: false,

          message:
            "Miller profile not found.",
        });
      }

      const demand =
        await MillerDemand.findOne({
          _id:
            demandId,

          millerId:
            miller._id,
        });

      if (!demand) {
        return res.status(404).json({
          success: false,

          message:
            "Demand not found or does not belong to this Miller.",
        });
      }

      if (
        demand.status !==
        "open"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Only open demands can be used for matching.",
        });
      }

      const harvests =
        await Harvest.find({
          _id: {
            $in:
              uniqueHarvestIds,
          },

          status:
            "available",
        }).populate({
          path:
            "farmerId",

          select:
            "farmerName district location farmName farmSizeAcres mainPaddyVariety",
        });

      const harvestMap =
        new Map(
          harvests.map(
            (harvest) => [
              String(
                harvest._id
              ),

              harvest,
            ]
          )
        );

      const createdSelections =
        [];

      const skippedSelections =
        [];

      for (
        const harvestId of
        uniqueHarvestIds
      ) {
        const harvest =
          harvestMap.get(
            harvestId
          );

        if (!harvest) {
          skippedSelections.push({
            harvestId,

            reason:
              "Harvest was not found or is no longer available.",
          });

          continue;
        }

        if (
          !harvest.farmerId
        ) {
          skippedSelections.push({
            harvestId,

            reason:
              "The linked Farmer profile was not found.",
          });

          continue;
        }

        if (
          normalizeText(
            harvest.paddyType
          ) !==
          normalizeText(
            demand.paddyType
          )
        ) {
          skippedSelections.push({
            harvestId,

            reason:
              "The Harvest paddy type does not match the Miller demand.",
          });

          continue;
        }

        const farmer =
          harvest.farmerId;

        const evaluationDemand =
          {
            ...demand.toObject(),

            millerId:
              miller,
          };

        const evaluation =
          evaluateDemand({
            demand:
              evaluationDemand,

            harvest,
            farmer,

            perspective:
              "miller",
          });

        try {
          const selection =
            await MatchSelection.create({
              harvestId:
                harvest._id,

              farmerId:
                farmer._id,

              millerId:
                miller._id,

              demandId:
                demand._id,

              matchingScore:
                evaluation
                  .matchingPercentage,

              initiatedBy:
                "miller",

              status:
                "pending",

              initiatedAt:
                new Date(),
            });

          const populated =
            await populateSelection(
              selection._id
            );

          createdSelections.push(
            populated
          );
        } catch (error) {
          if (
            error.code ===
            11000
          ) {
            skippedSelections.push({
              harvestId,

              reason:
                "A matching request already exists for this Harvest and Demand.",
            });

            continue;
          }

          throw error;
        }
      }

      if (
        createdSelections.length ===
        0
      ) {
        return res.status(409).json({
          success: false,

          message:
            "No new matching requests were created.",

          data: {
            demandId:
              String(
                demand._id
              ),

            createdCount:
              0,

            skippedCount:
              skippedSelections.length,

            selections:
              [],

            skippedSelections,
          },
        });
      }

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Matching requests were sent to the selected Farmers.",

          data: {
            demandId:
              String(
                demand._id
              ),

            initiatedBy:
              "miller",

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
        "CREATE MILLER MATCH REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to create Miller matching requests.",
      });
    }
  };

/**
 * Either Farmer or Miller responds.
 *
 * Only the OTHER participant can respond.
 *
 * PATCH
 * /api/match-selections/:selectionId/respond
 *
 * Body:
 *
 * {
 *   decision: "accepted"
 * }
 *
 * or
 *
 * {
 *   decision: "rejected"
 * }
 */
const respondToSelection =
  async (req, res) => {
    try {
      const {
        selectionId,
      } = req.params;

      const {
        decision,
      } = req.body;

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
        ![
          "accepted",
          "rejected",
        ].includes(
          decision
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Decision must be either accepted or rejected.",
        });
      }

      const selection =
        await MatchSelection.findById(
          selectionId
        );

      if (!selection) {
        return res.status(404).json({
          success: false,

          message:
            "Matching request not found.",
        });
      }

      if (
        selection.status !==
        "pending"
      ) {
        return res.status(409).json({
          success: false,

          message:
            "This matching request has already been processed.",
        });
      }

      /**
       * Farmer initiated request:
       * only Miller can respond.
       */
      if (
        selection.initiatedBy ===
        "farmer"
      ) {
        if (
          req.user.role !==
          "miller"
        ) {
          return res.status(403).json({
            success: false,

            message:
              "Only the selected Miller can respond to this Farmer request.",
          });
        }

        const miller =
          await Miller.findOne({
            user:
              req.user._id,
          });

        if (
          !miller ||
          String(
            miller._id
          ) !==
            String(
              selection.millerId
            )
        ) {
          return res.status(403).json({
            success: false,

            message:
              "You are not authorized to respond to this request.",
          });
        }
      }

      /**
       * Miller initiated request:
       * only Farmer can respond.
       */
      if (
        selection.initiatedBy ===
        "miller"
      ) {
        if (
          req.user.role !==
          "farmer"
        ) {
          return res.status(403).json({
            success: false,

            message:
              "Only the selected Farmer can respond to this Miller request.",
          });
        }

        const farmer =
          await Farmer.findOne({
            user:
              req.user._id,
          });

        if (
          !farmer ||
          String(
            farmer._id
          ) !==
            String(
              selection.farmerId
            )
        ) {
          return res.status(403).json({
            success: false,

            message:
              "You are not authorized to respond to this request.",
          });
        }
      }

      const harvest =
        await Harvest.findById(
          selection.harvestId
        );

      const demand =
        await MillerDemand.findById(
          selection.demandId
        );

      const [
        selectionFarmer,
        selectionMiller,
      ] = await Promise.all([
        Farmer.findById(
          selection.farmerId
        ),
        Miller.findById(
          selection.millerId
        ),
      ]);

      if (
        decision ===
        "accepted"
      ) {
        if (
          !harvest ||
          harvest.status !==
            "available"
        ) {
          return res.status(409).json({
            success: false,

            message:
              "The selected Harvest is no longer available.",
          });
        }

        if (
          !demand ||
          demand.status !==
            "open"
        ) {
          return res.status(409).json({
            success: false,

            message:
              "The selected Miller demand is no longer open.",
          });
        }

        selection.status =
          "negotiation_ready";

        selection.respondedAt =
          new Date();

        await selection.save();

        await Harvest
          .findByIdAndUpdate(
            harvest._id,
            {
              status:
                "matched",
            },
            {
              runValidators:
                true,
            }
          );

        await MillerDemand
          .findByIdAndUpdate(
            demand._id,
            {
              status:
                "negotiation_ready",
            },
            {
              runValidators:
                true,
            }
          );

        /**
         * Once this Harvest + Demand combination is accepted,
         * cancel other pending selections that compete for
         * either the same Harvest or the same Demand.
         */
        await MatchSelection.updateMany(
          {
            _id: {
              $ne:
                selection._id,
            },

            status:
              "pending",

            $or: [
              {
                harvestId:
                  harvest._id,
              },

              {
                demandId:
                  demand._id,
              },
            ],
          },

          {
            status:
              "cancelled",

            respondedAt:
              new Date(),
          }
        );

        const updatedSelection =
          await populateSelection(
            selection._id
          );

        const initiatorRecipient =
          selection.initiatedBy ===
          "farmer"
            ? {
                type: "farmer",
                id:
                  selection.farmerId,
              }
            : {
                type: "miller",
                id:
                  selection.millerId,
              };

        const responderProfile =
          selection.initiatedBy ===
          "farmer"
            ? selectionMiller
            : selectionFarmer;

        const responderName =
          selection.initiatedBy ===
          "farmer"
            ? selectionMiller?.millName ||
              selectionMiller?.name ||
              "Miller"
            : selectionFarmer?.farmerName ||
              "Farmer";

        await createMarketplaceNotification({
          recipientType:
            initiatorRecipient.type,
          recipientId:
            initiatorRecipient.id,
          actorType:
            selection.initiatedBy ===
            "farmer"
              ? "miller"
              : "farmer",
          actorId:
            responderProfile?._id ||
            null,
          actorName:
            responderName,
          type:
            "MATCH_ACCEPTED",

          titleEnglish:
            "Match request accepted",
          titleSinhala:
            "ගැළපීමේ ඉල්ලීම පිළිගෙන ඇත",

          messageEnglish:
            `${responderName} accepted your match request. AI negotiation is now ready.`,
          messageSinhala:
            `${responderName} ඔබගේ ගැළපීමේ ඉල්ලීම පිළිගෙන ඇත. AI සාකච්ඡාව දැන් සූදානම්ය.`,

          relatedHarvestId:
            harvest._id,
          relatedSelectionId:
            selection._id,
        });

        await Promise.all([
          createMarketplaceNotification({
            recipientType:
              "farmer",
            recipientId:
              selection.farmerId,
            actorType:
              "system",
            actorName:
              "Digital Goviya AI",
            type:
              "NEGOTIATION_READY",

            titleEnglish:
              "AI negotiation ready",
            titleSinhala:
              "AI සාකච්ඡාව සූදානම්",

            messageEnglish:
              `Your match with ${selectionMiller?.millName || selectionMiller?.name || "the Miller"} is ready for AI negotiation.`,
            messageSinhala:
              `ඔබගේ ගැළපීම AI සාකච්ඡාව සඳහා සූදානම්ය.`,

            relatedHarvestId:
              harvest._id,
            relatedSelectionId:
              selection._id,
          }),

          createMarketplaceNotification({
            recipientType:
              "miller",
            recipientId:
              selection.millerId,
            actorType:
              "system",
            actorName:
              "Digital Goviya AI",
            type:
              "NEGOTIATION_READY",

            titleEnglish:
              "AI negotiation ready",
            titleSinhala:
              "AI සාකච්ඡාව සූදානම්",

            messageEnglish:
              `Your match with ${selectionFarmer?.farmerName || "the Farmer"} is ready for AI negotiation.`,
            messageSinhala:
              `ඔබගේ ගැළපීම AI සාකච්ඡාව සඳහා සූදානම්ය.`,

            relatedHarvestId:
              harvest._id,
            relatedSelectionId:
              selection._id,
          }),
        ]);

        return res
          .status(200)
          .json({
            success: true,

            message:
              "Match accepted. Farmer and Miller can now proceed to AI negotiation.",

            data: {
              selection:
                updatedSelection,
            },
          });
      }

      /**
       * Rejection
       */
      selection.status =
        "rejected";

      selection.respondedAt =
        new Date();

      await selection.save();

      const updatedSelection =
        await populateSelection(
          selection._id
        );

      const rejectionRecipient =
        selection.initiatedBy ===
        "farmer"
          ? {
              type: "farmer",
              id:
                selection.farmerId,
            }
          : {
              type: "miller",
              id:
                selection.millerId,
            };

      const rejectionActorName =
        selection.initiatedBy ===
        "farmer"
          ? selectionMiller?.millName ||
            selectionMiller?.name ||
            "Miller"
          : selectionFarmer?.farmerName ||
            "Farmer";

      await createMarketplaceNotification({
        recipientType:
          rejectionRecipient.type,
        recipientId:
          rejectionRecipient.id,
        actorType:
          selection.initiatedBy ===
          "farmer"
            ? "miller"
            : "farmer",
        actorId:
          selection.initiatedBy ===
          "farmer"
            ? selectionMiller?._id
            : selectionFarmer?._id,
        actorName:
          rejectionActorName,
        type:
          "MATCH_REJECTED",

        titleEnglish:
          "Match request declined",
        titleSinhala:
          "ගැළපීමේ ඉල්ලීම ප්‍රතික්ෂේප කර ඇත",

        messageEnglish:
          `${rejectionActorName} declined your match request.`,
        messageSinhala:
          `${rejectionActorName} ඔබගේ ගැළපීමේ ඉල්ලීම ප්‍රතික්ෂේප කර ඇත.`,

        relatedHarvestId:
          harvest?._id ||
          selection.harvestId,
        relatedSelectionId:
          selection._id,
      });

      return res
        .status(200)
        .json({
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
 * Returns both:
 * - requests sent by Miller
 * - requests received by Miller
 */
const getMillerSelections =
  async (req, res) => {
    try {
      const miller =
        await Miller.findOne({
          user:
            req.user._id,
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
          millerId:
            miller._id,
        })
          .populate(
            "harvestId"
          )

          .populate({
            path:
              "farmerId",

            select:
              "farmerName district location farmName",
          })

          .populate({
            path:
              "demandId",
          })

          .sort({
            createdAt: -1,
          });

      return res
        .status(200)
        .json({
          success: true,

          count:
            selections.length,

          data:
            selections,
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
          "Failed to retrieve Miller matching requests.",
      });
    }
  };

/**
 * GET /api/match-selections/farmer
 *
 * Returns both:
 * - requests sent by Farmer
 * - requests received by Farmer
 */
const getFarmerSelections =
  async (req, res) => {
    try {
      const farmer =
        await Farmer.findOne({
          user:
            req.user._id,
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
          farmerId:
            farmer._id,
        })
          .populate(
            "harvestId"
          )

          .populate({
            path:
              "millerId",

            select:
              "name millName district location businessRegistrationNumber purchasingCapacityKg",
          })

          .populate(
            "demandId"
          )

          .sort({
            createdAt: -1,
          });

      return res
        .status(200)
        .json({
          success: true,

          count:
            selections.length,

          data:
            selections,
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
          "Failed to retrieve Farmer matching requests.",
      });
    }
  };

module.exports = {
  createSelections,
  createSelectionsByMiller,
  respondToSelection,
  getMillerSelections,
  getFarmerSelections,
};