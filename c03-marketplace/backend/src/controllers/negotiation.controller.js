const crypto = require("crypto");
const mongoose = require("mongoose");

const Negotiation = require(
  "../models/negotiation.model"
);

const MatchSelection = require(
  "../models/matchSelection.model"
);

const Farmer = require(
  "../models/farmer.model"
);

const Miller = require(
  "../models/miller.model"
);

const Harvest = require(
  "../models/harvest.model"
);

const MillerDemand = require(
  "../models/millerDemand.model"
);

const {
  createMarketplaceNotification,
} = require(
  "../services/notification.service"
);

const {
  runNegotiation,
  checkNegotiationHealth,
} = require(
  "../services/negotiation.service"
);

const buildParticipantFilter = async (
  user
) => {
  if (user.role === "farmer") {
    const farmer = await Farmer.findOne({
      user: user._id,
    });

    return farmer
      ? {
          farmerId: farmer._id,
        }
      : null;
  }

  const miller = await Miller.findOne({
    user: user._id,
  });

  return miller
    ? {
        millerId: miller._id,
      }
    : null;
};

const startNegotiation = async (
  req,
  res
) => {
  try {
    const { selectionId } = req.body;

    if (
      !selectionId ||
      !mongoose.Types.ObjectId.isValid(
        selectionId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid match selection ID is required.",
      });
    }

    const participantFilter =
      await buildParticipantFilter(
        req.user
      );

    if (!participantFilter) {
      return res.status(404).json({
        success: false,
        message:
          `${req.user.role} profile not found.`,
      });
    }

    const selection =
      await MatchSelection.findOne({
        _id: selectionId,
        ...participantFilter,
      });

    if (!selection) {
      return res.status(404).json({
        success: false,
        message:
          "The match selection was not found or does not belong to this user.",
      });
    }

    if (
      selection.status !==
      "negotiation_ready"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This match is not ready for negotiation.",
      });
    }

    const existingNegotiation =
      await Negotiation.findOne({
        listingId: selection._id,
      });

    if (existingNegotiation) {
      return res.status(200).json({
        success: true,
        message:
          "A negotiation already exists for this match.",
        data: existingNegotiation,
      });
    }

    const [
      harvest,
      demand,
      farmer,
      miller,
    ] = await Promise.all([
      Harvest.findById(
        selection.harvestId
      ).select(
        "+minimumAcceptablePrice"
      ),

      MillerDemand.findById(
        selection.demandId
      ).select(
        "+maximumBuyingPrice"
      ),

      Farmer.findById(
        selection.farmerId
      ),

      Miller.findById(
        selection.millerId
      ),
    ]);

    if (
      !harvest ||
      !demand ||
      !farmer ||
      !miller
    ) {
      return res.status(409).json({
        success: false,
        message:
          "The linked harvest, demand, Farmer or Miller record is unavailable.",
      });
    }

    if (
      harvest.status === "sold" ||
      harvest.status === "cancelled"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This harvest is no longer available for negotiation.",
      });
    }

    if (
      [
        "fulfilled",
        "agreement_reached",
        "cancelled",
        "rejected",
        "negotiation_failed",
      ].includes(demand.status)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This demand is no longer available for negotiation.",
      });
    }

    if (
      harvest.minimumAcceptablePrice ==
        null ||
      demand.maximumBuyingPrice == null
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Private negotiation limits are missing for this match.",
      });
    }

    const negotiationId =
      `NEG-${crypto.randomUUID()}`;

    const payload = {
      negotiation_id:
        negotiationId,

      paddy_type:
        harvest.paddyType,

      quantity_kg: Math.min(
        Number(harvest.quantity),
        Number(demand.quantityNeeded)
      ),

      district:
        farmer.district,

      farmer_expected_price:
        Number(
          harvest.expectedPrice
        ),

      farmer_minimum_price:
        Number(
          harvest.minimumAcceptablePrice
        ),

      miller_opening_price:
        Number(
          demand.offeredPrice
        ),

      miller_maximum_price:
        Number(
          demand.maximumBuyingPrice
        ),

      fl_reference_price:
        Number(
          harvest.aiPredictedPrice ||
            harvest.expectedPrice
        ),

      matching_score:
        Number(
          selection.matchingScore
        ),

      max_rounds: 6,
    };

    console.log(
      "NEGOTIATION PAYLOAD:",
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    const result =
      await runNegotiation(
        payload
      );

    const savedNegotiation =
      await Negotiation.create({
        negotiationId:
          result.negotiation_id,

        listingId:
          selection._id,

        farmerId:
          farmer._id,

        millerId:
          miller._id,

        requestData:
          payload,

        status:
          result.status,

        agreedPrice:
          result.agreed_price,

        roundsCompleted:
          result.rounds_completed,

        finalReason:
          result.final_reason,

        flReferencePrice:
          result.fl_reference_price,

        fairnessScore:
          result.fairness_score,

        priceDifferenceFromReference:
          result
            .price_difference_from_reference,

        history:
          result.history,
      });

    if (
      result.status ===
      "agreed"
    ) {
      await Promise.all([
        Harvest.findByIdAndUpdate(
          harvest._id,
          {
            status: "sold",
          },
          {
            runValidators: true,
          }
        ),

        MillerDemand.findByIdAndUpdate(
          demand._id,
          {
            status:
              "agreement_reached",
          },
          {
            runValidators: true,
          }
        ),
      ]);

      await Promise.all([
        createMarketplaceNotification({
          recipientType:
            "farmer",
          recipientId:
            farmer._id,
          actorType:
            "system",
          actorName:
            "Digital Goviya AI",
          type:
            "NEGOTIATION_AGREED",

          titleEnglish:
            "AI negotiation successful",
          titleSinhala:
            "AI සාකච්ඡාව සාර්ථකයි",

          messageEnglish:
            `Agreement reached with ${miller.millName || miller.name} at Rs.${Number(result.agreed_price).toFixed(2)}/kg.`,
          messageSinhala:
            `${miller.millName || miller.name} සමඟ කිලෝග්‍රෑමයකට රු.${Number(result.agreed_price).toFixed(2)} මිලකට එකඟතාවයකට පැමිණ ඇත.`,

          relatedHarvestId:
            harvest._id,
          relatedSelectionId:
            selection._id,
          relatedNegotiationId:
            savedNegotiation._id,
          relatedNegotiationCode:
            savedNegotiation.negotiationId,
        }),

        createMarketplaceNotification({
          recipientType:
            "miller",
          recipientId:
            miller._id,
          actorType:
            "system",
          actorName:
            "Digital Goviya AI",
          type:
            "NEGOTIATION_AGREED",

          titleEnglish:
            "AI negotiation successful",
          titleSinhala:
            "AI සාකච්ඡාව සාර්ථකයි",

          messageEnglish:
            `Agreement reached with ${farmer.farmerName} at Rs.${Number(result.agreed_price).toFixed(2)}/kg.`,
          messageSinhala:
            `${farmer.farmerName} සමඟ කිලෝග්‍රෑමයකට රු.${Number(result.agreed_price).toFixed(2)} මිලකට එකඟතාවයකට පැමිණ ඇත.`,

          relatedHarvestId:
            harvest._id,
          relatedSelectionId:
            selection._id,
          relatedNegotiationId:
            savedNegotiation._id,
          relatedNegotiationCode:
            savedNegotiation.negotiationId,
        }),
      ]);
    } else {
      await MillerDemand.findByIdAndUpdate(
        demand._id,
        {
          status:
            "negotiation_failed",
        },
        {
          runValidators: true,
        }
      );

      await Promise.all([
        createMarketplaceNotification({
          recipientType:
            "farmer",
          recipientId:
            farmer._id,
          actorType:
            "system",
          actorName:
            "Digital Goviya AI",
          type:
            "NEGOTIATION_FAILED",

          titleEnglish:
            "AI negotiation ended",
          titleSinhala:
            "AI සාකච්ඡාව අවසන් විය",

          messageEnglish:
            `No agreement was reached with ${miller.millName || miller.name}.`,
          messageSinhala:
            `${miller.millName || miller.name} සමඟ එකඟතාවයකට පැමිණීමට නොහැකි විය.`,

          relatedHarvestId:
            harvest._id,
          relatedSelectionId:
            selection._id,
          relatedNegotiationId:
            savedNegotiation._id,
          relatedNegotiationCode:
            savedNegotiation.negotiationId,
        }),

        createMarketplaceNotification({
          recipientType:
            "miller",
          recipientId:
            miller._id,
          actorType:
            "system",
          actorName:
            "Digital Goviya AI",
          type:
            "NEGOTIATION_FAILED",

          titleEnglish:
            "AI negotiation ended",
          titleSinhala:
            "AI සාකච්ඡාව අවසන් විය",

          messageEnglish:
            `No agreement was reached with ${farmer.farmerName}.`,
          messageSinhala:
            `${farmer.farmerName} සමඟ එකඟතාවයකට පැමිණීමට නොහැකි විය.`,

          relatedHarvestId:
            harvest._id,
          relatedSelectionId:
            selection._id,
          relatedNegotiationId:
            savedNegotiation._id,
          relatedNegotiationCode:
            savedNegotiation.negotiationId,
        }),
      ]);
    }

    return res.status(201).json({
      success: true,
      message:
        result.status ===
        "agreed"
          ? "The AI agents reached an agreement."
          : "The AI negotiation completed without an agreement.",
      data:
        savedNegotiation,
    });
  } catch (error) {
    console.error(
      "START NEGOTIATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Negotiation failed.",
    });
  }
};

const getNegotiation = async (
  req,
  res
) => {
  try {
    const participantFilter =
      await buildParticipantFilter(
        req.user
      );

    if (!participantFilter) {
      return res.status(404).json({
        success: false,
        message:
          `${req.user.role} profile not found.`,
      });
    }

    const negotiation =
      await Negotiation.findOne({
        negotiationId:
          req.params.negotiationId,

        ...participantFilter,
      });

    if (!negotiation) {
      return res.status(404).json({
        success: false,
        message:
          "Negotiation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data:
        negotiation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

const listMyNegotiations = async (
  req,
  res
) => {
  try {
    const participantFilter =
      await buildParticipantFilter(
        req.user
      );

    if (!participantFilter) {
      return res.status(404).json({
        success: false,
        message:
          `${req.user.role} profile not found.`,
      });
    }

    const negotiations =
      await Negotiation.find(
        participantFilter
      )
        .sort({
          createdAt: -1,
        })
        .limit(100);

    return res.status(200).json({
      success: true,
      count:
        negotiations.length,
      data:
        negotiations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

const negotiationHealth = async (
  req,
  res
) => {
  try {
    const result =
      await checkNegotiationHealth();

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message:
        "Negotiation AI service is unavailable.",
    });
  }
};

module.exports = {
  startNegotiation,
  getNegotiation,
  listMyNegotiations,
  negotiationHealth,
};
