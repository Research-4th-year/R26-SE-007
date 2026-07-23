const crypto = require("crypto");

const Negotiation = require(
  "../models/negotiation.model"
);

const {
  runNegotiation,
  checkNegotiationHealth,
} = require("../services/negotiation.service");

const startNegotiation = async (req, res) => {
  try {
    const negotiationId =
      req.body.negotiation_id ||
      `NEG-${crypto.randomUUID()}`;

    const payload = {
      negotiation_id: negotiationId,
      paddy_type: req.body.paddy_type,
      quantity_kg: Number(req.body.quantity_kg),
      district: req.body.district,

      farmer_expected_price: Number(
        req.body.farmer_expected_price
      ),
      farmer_minimum_price: Number(
        req.body.farmer_minimum_price
      ),

      miller_opening_price: Number(
        req.body.miller_opening_price
      ),
      miller_maximum_price: Number(
        req.body.miller_maximum_price
      ),

      fl_reference_price: Number(
        req.body.fl_reference_price
      ),

      matching_score: Number(
        req.body.matching_score
      ),

      max_rounds: Number(
        req.body.max_rounds || 6
      ),
    };

    const result = await runNegotiation(payload);

    const savedNegotiation =
      await Negotiation.create({
        negotiationId:
          result.negotiation_id,

        listingId:
          req.body.listing_id || null,

        farmerId:
          req.body.farmer_id || null,

        millerId:
          req.body.miller_id || null,

        requestData: payload,

        status: result.status,

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

        history: result.history,
      });

    return res.status(201).json({
      success: true,
      message: "Negotiation completed.",
      data: savedNegotiation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Negotiation failed.",
    });
  }
};

const getNegotiation = async (req, res) => {
  try {
    const negotiation =
      await Negotiation.findOne({
        negotiationId:
          req.params.negotiationId,
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
      data: negotiation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const listNegotiations = async (req, res) => {
  try {
    const negotiations =
      await Negotiation.find()
        .sort({ createdAt: -1 })
        .limit(100);

    return res.status(200).json({
      success: true,
      count: negotiations.length,
      data: negotiations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
  listNegotiations,
  negotiationHealth,
};