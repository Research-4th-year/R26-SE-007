const mongoose = require("mongoose");

const Negotiation = require(
  "../models/negotiation.model"
);

const Farmer = require(
  "../models/farmer.model"
);

const Miller = require(
  "../models/miller.model"
);

const User = require(
  "../models/user.model"
);

const ContactRequest = require(
  "../models/contactRequest.model"
);

const FavoritePartner = require(
  "../models/favoritePartner.model"
);

/**
 * Resolve the logged-in marketplace profile.
 */
const getCurrentProfile = async (
  user
) => {
  if (
    user.role === "farmer"
  ) {
    const farmer =
      await Farmer.findOne({
        user: user._id,
      });

    return farmer
      ? {
          type: "farmer",
          profile: farmer,
        }
      : null;
  }

  const miller =
    await Miller.findOne({
      user: user._id,
    });

  return miller
    ? {
        type: "miller",
        profile: miller,
      }
    : null;
};

/**
 * Convert a negotiation into a small transaction item.
 */
const buildTransactionItem = (
  negotiation
) => {
  const quantity =
    Number(
      negotiation.requestData
        ?.quantity_kg || 0
    );

  const agreedPrice =
    Number(
      negotiation.agreedPrice || 0
    );

  return {
    negotiationMongoId:
      negotiation._id,

    negotiationId:
      negotiation.negotiationId,

    paddyType:
      negotiation.requestData
        ?.paddy_type || "",

    quantityKg:
      quantity,

    agreedPrice:
      agreedPrice,

    totalValue:
      Number(
        (
          quantity *
          agreedPrice
        ).toFixed(2)
      ),

    roundsCompleted:
      negotiation.roundsCompleted,

    fairnessScore:
      negotiation.fairnessScore,

    flReferencePrice:
      negotiation.flReferencePrice,

    priceDifferenceFromReference:
      negotiation
        .priceDifferenceFromReference,

    status:
      negotiation.status,

    finalReason:
      negotiation.finalReason,

    createdAt:
      negotiation.createdAt,
  };
};

/**
 * Return the public/safe partner profile.
 *
 * Phone is deliberately excluded here.
 */
const buildSafePartnerProfile = (
  partnerType,
  partner
) => {
  if (
    partnerType === "farmer"
  ) {
    return {
      id: partner._id,

      type: "farmer",

      name:
        partner.farmerName,

      farmerName:
        partner.farmerName,

      district:
        partner.district,

      location:
        partner.location,

      farmName:
        partner.farmName,

      farmSizeAcres:
        partner.farmSizeAcres,

      mainPaddyVariety:
        partner.mainPaddyVariety,
    };
  }

  return {
    id: partner._id,

    type: "miller",

    name:
      partner.millName ||
      partner.name,

    personName:
      partner.name,

    millName:
      partner.millName,

    district:
      partner.district,

    location:
      partner.location,

    businessRegistrationNumber:
      partner
        .businessRegistrationNumber,

    purchasingCapacityKg:
      partner
        .purchasingCapacityKg,
  };
};

/**
 * Check whether contact details have ever been
 * unlocked between this Farmer/Miller pair.
 *
 * We only consider contact requests linked to
 * successful negotiations between the same pair.
 */
const getUnlockedContact = async ({
  farmerId,
  millerId,
}) => {
  const agreedNegotiations =
    await Negotiation.find({
      farmerId,
      millerId,
      status: "agreed",
    }).select("_id");

  if (
    agreedNegotiations.length ===
    0
  ) {
    return {
      unlocked: false,
      request: null,
    };
  }

  const negotiationIds =
    agreedNegotiations.map(
      (item) => item._id
    );

  const acceptedRequest =
    await ContactRequest.findOne({
      farmerId,
      millerId,
      negotiationId: {
        $in: negotiationIds,
      },
      status: "accepted",
    }).sort({
      respondedAt: -1,
      updatedAt: -1,
    });

  return {
    unlocked:
      Boolean(
        acceptedRequest
      ),

    request:
      acceptedRequest,
  };
};

/**
 * GET /api/partners
 *
 * Returns all successful trading partners
 * for the logged-in Farmer/Miller.
 */
const getMyPartners = async (
  req,
  res
) => {
  try {
    const current =
      await getCurrentProfile(
        req.user
      );

    if (!current) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            `${req.user.role} profile not found.`,
        });
    }

    const ownerType =
      current.type;

    const ownerId =
      current.profile._id;

    const negotiationFilter =
      ownerType === "farmer"
        ? {
            farmerId:
              ownerId,
            status:
              "agreed",
          }
        : {
            millerId:
              ownerId,
            status:
              "agreed",
          };

    const negotiations =
      await Negotiation.find(
        negotiationFilter
      ).sort({
        createdAt: -1,
      });

    if (
      negotiations.length ===
      0
    ) {
      return res
        .status(200)
        .json({
          success: true,
          count: 0,
          data: [],
        });
    }

    const grouped =
      new Map();

    for (
      const negotiation
      of negotiations
    ) {
      const partnerId =
        ownerType === "farmer"
          ? String(
              negotiation.millerId
            )
          : String(
              negotiation.farmerId
            );

      if (
        !partnerId ||
        partnerId ===
          "undefined" ||
        partnerId ===
          "null"
      ) {
        continue;
      }

      if (
        !grouped.has(
          partnerId
        )
      ) {
        grouped.set(
          partnerId,
          []
        );
      }

      grouped
        .get(partnerId)
        .push(
          negotiation
        );
    }

    const partnerType =
      ownerType === "farmer"
        ? "miller"
        : "farmer";

    const partnerIds =
      Array.from(
        grouped.keys()
      ).map(
        (id) =>
          new mongoose.Types.ObjectId(
            id
          )
      );

    const [
      partnerProfiles,
      favorites,
    ] =
      await Promise.all([
        partnerType ===
        "miller"
          ? Miller.find({
              _id: {
                $in:
                  partnerIds,
              },
            })
          : Farmer.find({
              _id: {
                $in:
                  partnerIds,
              },
            }),

        FavoritePartner.find({
          ownerType,
          ownerId,
          partnerType,
          partnerId: {
            $in:
              partnerIds,
          },
        }),
      ]);

    const favoriteSet =
      new Set(
        favorites.map(
          (favorite) =>
            String(
              favorite.partnerId
            )
        )
      );

    const profileMap =
      new Map(
        partnerProfiles.map(
          (profile) => [
            String(profile._id),
            profile,
          ]
        )
      );

    const result = [];

    for (
      const [
        partnerId,
        partnerNegotiations,
      ] of grouped.entries()
    ) {
      const partner =
        profileMap.get(
          partnerId
        );

      if (!partner) {
        continue;
      }

      const totalQuantityKg =
        partnerNegotiations.reduce(
          (
            total,
            negotiation
          ) =>
            total +
            Number(
              negotiation
                .requestData
                ?.quantity_kg ||
                0
            ),
          0
        );

      const totalPrice =
        partnerNegotiations.reduce(
          (
            total,
            negotiation
          ) =>
            total +
            Number(
              negotiation
                .agreedPrice ||
                0
            ),
          0
        );

      const averageAgreedPrice =
        partnerNegotiations
          .length > 0
          ? Number(
              (
                totalPrice /
                partnerNegotiations
                  .length
              ).toFixed(2)
            )
          : 0;

      const latestNegotiation =
        partnerNegotiations[0];

      const paddyTypes =
        Array.from(
          new Set(
            partnerNegotiations
              .map(
                (negotiation) =>
                  negotiation
                    .requestData
                    ?.paddy_type
              )
              .filter(Boolean)
          )
        );

      const contactState =
        await getUnlockedContact({
          farmerId:
            ownerType ===
            "farmer"
              ? ownerId
              : partner._id,

          millerId:
            ownerType ===
            "miller"
              ? ownerId
              : partner._id,
        });

      result.push({
        partner:
          buildSafePartnerProfile(
            partnerType,
            partner
          ),

        summary: {
          totalAgreements:
            partnerNegotiations.length,

          totalQuantityKg:
            Number(
              totalQuantityKg.toFixed(
                2
              )
            ),

          averageAgreedPrice,

          latestAgreedPrice:
            Number(
              latestNegotiation
                .agreedPrice ||
                0
            ),

          lastTransactionAt:
            latestNegotiation
              .createdAt,

          paddyTypes,
        },

        isFavorite:
          favoriteSet.has(
            partnerId
          ),

        contactUnlocked:
          contactState.unlocked,
      });
    }

    result.sort(
      (first, second) => {
        if (
          first.isFavorite !==
          second.isFavorite
        ) {
          return first
            .isFavorite
            ? -1
            : 1;
        }

        return (
          new Date(
            second.summary
              .lastTransactionAt
          ).getTime() -
          new Date(
            first.summary
              .lastTransactionAt
          ).getTime()
        );
      }
    );

    return res
      .status(200)
      .json({
        success: true,
        count:
          result.length,
        data:
          result,
      });
  } catch (error) {
    console.error(
      "GET PARTNERS ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve trading partners.",
      });
  }
};

/**
 * GET
 * /api/partners/:partnerType/:partnerId
 */
const getPartnerDetails =
  async (req, res) => {
    try {
      const {
        partnerType,
        partnerId,
      } = req.params;

      if (
        ![
          "farmer",
          "miller",
        ].includes(
          partnerType
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Partner type must be farmer or miller.",
          });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          partnerId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid partner ID.",
          });
      }

      const current =
        await getCurrentProfile(
          req.user
        );

      if (!current) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              `${req.user.role} profile not found.`,
          });
      }

      const expectedPartnerType =
        current.type ===
        "farmer"
          ? "miller"
          : "farmer";

      if (
        partnerType !==
        expectedPartnerType
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              `A ${current.type} can only view ${expectedPartnerType} trading partners.`,
          });
      }

      const partner =
        partnerType ===
        "miller"
          ? await Miller.findById(
              partnerId
            )
          : await Farmer.findById(
              partnerId
            );

      if (!partner) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trading partner not found.",
          });
      }

      const negotiationFilter =
        current.type ===
        "farmer"
          ? {
              farmerId:
                current.profile._id,

              millerId:
                partner._id,

              status:
                "agreed",
            }
          : {
              millerId:
                current.profile._id,

              farmerId:
                partner._id,

              status:
                "agreed",
            };

      const negotiations =
        await Negotiation.find(
          negotiationFilter
        ).sort({
          createdAt: -1,
        });

      if (
        negotiations.length ===
        0
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "This user is not one of your successful trading partners.",
          });
      }

      const totalQuantityKg =
        negotiations.reduce(
          (
            total,
            negotiation
          ) =>
            total +
            Number(
              negotiation
                .requestData
                ?.quantity_kg ||
                0
            ),
          0
        );

      const totalAgreedPrice =
        negotiations.reduce(
          (
            total,
            negotiation
          ) =>
            total +
            Number(
              negotiation
                .agreedPrice ||
                0
            ),
          0
        );

      const averageAgreedPrice =
        Number(
          (
            totalAgreedPrice /
            negotiations.length
          ).toFixed(2)
        );

      const totalTradeValue =
        negotiations.reduce(
          (
            total,
            negotiation
          ) => {
            const quantity =
              Number(
                negotiation
                  .requestData
                  ?.quantity_kg ||
                  0
              );

            const price =
              Number(
                negotiation
                  .agreedPrice ||
                  0
              );

            return (
              total +
              quantity *
                price
            );
          },
          0
        );

      const paddyTypes =
        Array.from(
          new Set(
            negotiations
              .map(
                (negotiation) =>
                  negotiation
                    .requestData
                    ?.paddy_type
              )
              .filter(Boolean)
          )
        );

      const favorite =
        await FavoritePartner.findOne({
          ownerType:
            current.type,

          ownerId:
            current.profile._id,

          partnerType,

          partnerId:
            partner._id,
        });

      const farmerId =
        current.type ===
        "farmer"
          ? current.profile._id
          : partner._id;

      const millerId =
        current.type ===
        "miller"
          ? current.profile._id
          : partner._id;

      const contactState =
        await getUnlockedContact({
          farmerId,
          millerId,
        });

      let contact = null;

      if (
        contactState.unlocked
      ) {
        const partnerUser =
          await User.findById(
            partner.user
          ).select(
            "fullName phone"
          );

        if (partnerUser) {
          contact = {
            fullName:
              partnerUser.fullName,

            phone:
              partnerUser.phone,
          };
        }
      }

      const transactions =
        negotiations.map(
          buildTransactionItem
        );

      const latest =
        negotiations[0];

      return res
        .status(200)
        .json({
          success: true,

          data: {
            partner:
              buildSafePartnerProfile(
                partnerType,
                partner
              ),

            summary: {
              totalAgreements:
                negotiations.length,

              totalQuantityKg:
                Number(
                  totalQuantityKg.toFixed(
                    2
                  )
                ),

              averageAgreedPrice,

              latestAgreedPrice:
                Number(
                  latest.agreedPrice ||
                    0
                ),

              totalTradeValue:
                Number(
                  totalTradeValue.toFixed(
                    2
                  )
                ),

              lastTransactionAt:
                latest.createdAt,

              paddyTypes,
            },

            isFavorite:
              Boolean(
                favorite
              ),

            contactUnlocked:
              contactState.unlocked,

            contact,

            transactions,
          },
        });
    } catch (error) {
      console.error(
        "GET PARTNER DETAILS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message ||
            "Failed to retrieve partner details.",
        });
    }
  };

/**
 * POST
 * /api/partners/:partnerType/:partnerId/favorite
 */
const addFavoritePartner =
  async (req, res) => {
    try {
      const {
        partnerType,
        partnerId,
      } = req.params;

      if (
        ![
          "farmer",
          "miller",
        ].includes(
          partnerType
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Partner type must be farmer or miller.",
          });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          partnerId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid partner ID.",
          });
      }

      const current =
        await getCurrentProfile(
          req.user
        );

      if (!current) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              `${req.user.role} profile not found.`,
          });
      }

      const expectedPartnerType =
        current.type ===
        "farmer"
          ? "miller"
          : "farmer";

      if (
        partnerType !==
        expectedPartnerType
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid partner type for this account.",
          });
      }

      const partner =
        partnerType ===
        "miller"
          ? await Miller.findById(
              partnerId
            )
          : await Farmer.findById(
              partnerId
            );

      if (!partner) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Partner not found.",
          });
      }

      const negotiationExists =
        await Negotiation.exists(
          current.type ===
          "farmer"
            ? {
                farmerId:
                  current.profile._id,

                millerId:
                  partner._id,

                status:
                  "agreed",
              }
            : {
                millerId:
                  current.profile._id,

                farmerId:
                  partner._id,

                status:
                  "agreed",
              }
        );

      if (
        !negotiationExists
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Only successful trading partners can be saved as favourites.",
          });
      }

      const favorite =
        await FavoritePartner.findOneAndUpdate(
          {
            ownerType:
              current.type,

            ownerId:
              current.profile._id,

            partnerType,

            partnerId:
              partner._id,
          },
          {
            $setOnInsert: {
              savedAt:
                new Date(),
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Partner saved to favourites.",

          data: {
            favorite,
            isFavorite:
              true,
          },
        });
    } catch (error) {
      console.error(
        "ADD FAVORITE PARTNER ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.code ===
            11000
              ? "Partner is already saved."
              : error.message ||
                "Failed to save partner.",
        });
    }
  };

/**
 * DELETE
 * /api/partners/:partnerType/:partnerId/favorite
 */
const removeFavoritePartner =
  async (req, res) => {
    try {
      const {
        partnerType,
        partnerId,
      } = req.params;

      if (
        ![
          "farmer",
          "miller",
        ].includes(
          partnerType
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Partner type must be farmer or miller.",
          });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          partnerId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid partner ID.",
          });
      }

      const current =
        await getCurrentProfile(
          req.user
        );

      if (!current) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              `${req.user.role} profile not found.`,
          });
      }

      await FavoritePartner.findOneAndDelete({
        ownerType:
          current.type,

        ownerId:
          current.profile._id,

        partnerType,

        partnerId,
      });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Partner removed from favourites.",

          data: {
            isFavorite:
              false,
          },
        });
    } catch (error) {
      console.error(
        "REMOVE FAVORITE PARTNER ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message ||
            "Failed to remove favourite partner.",
        });
    }
  };

module.exports = {
  getMyPartners,
  getPartnerDetails,
  addFavoritePartner,
  removeFavoritePartner,
};