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

const Connection = require(
  "../models/connection.model"
);

const Harvest = require(
  "../models/harvest.model"
);

const MillerDemand = require(
  "../models/millerDemand.model"
);

// ======================================================
// CURRENT USER PROFILE
// ======================================================

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

  if (
    user.role === "miller"
  ) {
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
  }

  return null;
};

// ======================================================
// PARTNER TYPE
// ======================================================

const getPartnerType = (
  currentType
) => {
  return currentType ===
    "farmer"
    ? "miller"
    : "farmer";
};

// ======================================================
// SAFE PROFILE
// ======================================================

const buildSafePartnerProfile = (
  partnerType,
  partner,
  partnerUser = null
) => {
  if (
    partnerType ===
    "farmer"
  ) {
    return {
      id:
        partner._id,

      type:
        "farmer",

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

      isVerified:
        Boolean(
          partnerUser?.isVerified
        ),

      verificationSource:
        partnerUser
          ?.verificationSource ||
        "NONE",
    };
  }

  return {
    id:
      partner._id,

    type:
      "miller",

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

    isVerified:
      Boolean(
        partnerUser?.isVerified
      ),

    verificationSource:
      partnerUser
        ?.verificationSource ||
      "NONE",
  };
};

// ======================================================
// TRANSACTION ITEM
// ======================================================

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
      negotiation.agreedPrice ||
        0
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

// ======================================================
// TRADE SUMMARY
// ======================================================

const buildTradeSummary = (
  negotiations
) => {
  if (
    negotiations.length === 0
  ) {
    return {
      totalAgreements: 0,

      totalQuantityKg: 0,

      averageAgreedPrice: 0,

      latestAgreedPrice: 0,

      totalTradeValue: 0,

      lastTransactionAt:
        null,

      paddyTypes: [],
    };
  }

  const totalQuantityKg =
    negotiations.reduce(
      (
        total,
        negotiation
      ) =>
        total +
        Number(
          negotiation.requestData
            ?.quantity_kg || 0
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
          negotiation.agreedPrice ||
            0
        ),
      0
    );

  const totalTradeValue =
    negotiations.reduce(
      (
        total,
        negotiation
      ) => {
        const quantity =
          Number(
            negotiation.requestData
              ?.quantity_kg || 0
          );

        const price =
          Number(
            negotiation.agreedPrice ||
              0
          );

        return (
          total +
          quantity * price
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
              negotiation.requestData
                ?.paddy_type
          )
          .filter(Boolean)
      )
    );

  const latest =
    negotiations[0];

  return {
    totalAgreements:
      negotiations.length,

    totalQuantityKg:
      Number(
        totalQuantityKg.toFixed(
          2
        )
      ),

    averageAgreedPrice:
      Number(
        (
          totalAgreedPrice /
          negotiations.length
        ).toFixed(2)
      ),

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
  };
};

// ======================================================
// OLD NEGOTIATION CONTACT ACCESS
// ======================================================

const getNegotiationContactState =
  async ({
    farmerId,
    millerId,
  }) => {
    const agreedNegotiations =
      await Negotiation.find({
        farmerId,
        millerId,

        status:
          "agreed",
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
        (item) =>
          item._id
      );

    const acceptedRequest =
      await ContactRequest.findOne({
        farmerId,
        millerId,

        negotiationId: {
          $in:
            negotiationIds,
        },

        status:
          "accepted",
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

// ======================================================
// RELATIONSHIP STATE
// ======================================================

const getRelationshipState =
  async ({
    farmerId,
    millerId,
  }) => {
    const [
      connection,
      negotiationExists,
    ] =
      await Promise.all([
        Connection.findOne({
          farmerId,
          millerId,
        }),

        Negotiation.exists({
          farmerId,
          millerId,
          status:
            "agreed",
        }),
      ]);

    const connected =
      connection?.status ===
      "accepted";

    const hasTraded =
      Boolean(
        negotiationExists
      );

    return {
      connection,

      connected,

      hasTraded,

      isPartner:
        connected ||
        hasTraded,
    };
  };

// ======================================================
// CONTACT ACCESS
// ======================================================

const getContactAccess =
  async ({
    farmerId,
    millerId,
    relationship,
  }) => {
    /*
     * New connection system:
     *
     * Accepted Connection immediately
     * unlocks approved contact details.
     */
    if (
      relationship.connected
    ) {
      return {
        unlocked: true,

        source:
          "connection",
      };
    }

    /*
     * Keep old successful-negotiation
     * contact request logic working.
     */
    const oldContactState =
      await getNegotiationContactState({
        farmerId,
        millerId,
      });

    return {
      unlocked:
        oldContactState.unlocked,

      source:
        oldContactState.unlocked
          ? "negotiation_request"
          : null,
    };
  };

// ======================================================
// ACTIVE OPPORTUNITIES
// ======================================================

const getPartnerOpportunities =
  async ({
    currentType,
    partner,
    connected,
  }) => {
    /*
     * Opportunities are private to
     * accepted connections.
     */
    if (!connected) {
      return {
        harvests: [],
        demands: [],
      };
    }

    /*
     * Miller viewing Farmer:
     *
     * Return Farmer's currently
     * available harvests.
     */
    if (
      currentType === "miller"
    ) {
      const harvests =
        await Harvest.find({
          farmerId:
            partner._id,

          status:
            "available",
        })
          .select(
            "-minimumAcceptablePrice"
          )
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .lean();

      return {
        harvests:
          harvests.map(
            (harvest) => ({
              _id:
                harvest._id,

              paddyType:
                harvest.paddyType,

              season:
                harvest.season,

              quantity:
                harvest.quantity,

              expectedPrice:
                harvest.expectedPrice,

              aiPredictedPrice:
                harvest.aiPredictedPrice,

              priceLevel:
                harvest.priceLevel,

              harvestScore:
                harvest.harvestScore,

              marketStatus:
                harvest.marketStatus,

              status:
                harvest.status,

              createdAt:
                harvest.createdAt,
            })
          ),

        demands: [],
      };
    }

    /*
     * Farmer viewing Miller:
     *
     * Return Miller's currently
     * open demands.
     */
    const demands =
      await MillerDemand.find({
        millerId:
          partner._id,

        status:
          "open",
      })
        .select(
          "-maximumBuyingPrice"
        )
        .sort({
          createdAt: -1,
        })
        .limit(20)
        .lean();

    return {
      harvests: [],

      demands:
        demands.map(
          (demand) => ({
            _id:
              demand._id,

            paddyType:
              demand.paddyType,

            quantityNeeded:
              demand.quantityNeeded,

            offeredPrice:
              demand.offeredPrice,

            status:
              demand.status,

            createdAt:
              demand.createdAt,
          })
        ),
    };
  };

// ======================================================
// GET TRADE PARTNERS
// ======================================================

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
          success:
            false,

          message:
            `${req.user.role} profile not found.`,
        });
    }

    const ownerType =
      current.type;

    const ownerId =
      current.profile._id;

    const partnerType =
      getPartnerType(
        ownerType
      );

    /*
     * This endpoint remains the
     * TRADE PARTNER endpoint.
     *
     * Connected-only users come from
     * /connections/mine.
     */
    const negotiationFilter =
      ownerType ===
      "farmer"
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
          success:
            true,

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
        ownerType ===
        "farmer"
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
        .get(
          partnerId
        )
        .push(
          negotiation
        );
    }

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
            }).populate({
              path:
                "user",

              select:
                "isActive isVerified verificationSource",
            })
          : Farmer.find({
              _id: {
                $in:
                  partnerIds,
              },
            }).populate({
              path:
                "user",

              select:
                "isActive isVerified verificationSource",
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
            String(
              profile._id
            ),
            profile,
          ]
        )
      );

    const result = [];

    for (
      const [
        partnerId,
        partnerNegotiations,
      ]
      of grouped.entries()
    ) {
      const partner =
        profileMap.get(
          partnerId
        );

      if (
        !partner ||
        !partner.user ||
        !partner.user
          .isActive
      ) {
        continue;
      }

      const farmerId =
        ownerType ===
        "farmer"
          ? ownerId
          : partner._id;

      const millerId =
        ownerType ===
        "miller"
          ? ownerId
          : partner._id;

      const relationship =
        await getRelationshipState({
          farmerId,
          millerId,
        });

      const contactAccess =
        await getContactAccess({
          farmerId,
          millerId,
          relationship,
        });

      result.push({
        partner:
          buildSafePartnerProfile(
            partnerType,
            partner,
            partner.user
          ),

        summary:
          buildTradeSummary(
            partnerNegotiations
          ),

        relationship: {
          connected:
            relationship.connected,

          connectionId:
            relationship
              .connection?._id ||
            null,

          hasTraded:
            true,
        },

        isFavorite:
          favoriteSet.has(
            partnerId
          ),

        contactUnlocked:
          contactAccess.unlocked,
      });
    }

    result.sort(
      (
        first,
        second
      ) => {
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
        success:
          true,

        count:
          result.length,

        data:
          result,
      });
  } catch (
    error
  ) {
    console.error(
      "GET PARTNERS ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success:
          false,

        message:
          error.message ||
          "Failed to retrieve trading partners.",
      });
  }
};

// ======================================================
// GET PARTNER DETAILS
// ======================================================

const getPartnerDetails =
  async (
    req,
    res
  ) => {
    try {
      const {
        partnerType,
        partnerId,
      } =
        req.params;

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
            success:
              false,

            message:
              "Partner type must be farmer or miller.",
          });
      }

      if (
        !mongoose.Types
          .ObjectId
          .isValid(
            partnerId
          )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

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
            success:
              false,

            message:
              `${req.user.role} profile not found.`,
          });
      }

      const expectedPartnerType =
        getPartnerType(
          current.type
        );

      if (
        partnerType !==
        expectedPartnerType
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              `A ${current.type} can only view ${expectedPartnerType} partners.`,
          });
      }

      /*
       * Populate User here.
       *
       * This is important because contact
       * MUST come from the PARTNER'S User.
       */
      const partner =
        partnerType ===
        "miller"
          ? await Miller
              .findById(
                partnerId
              )
              .populate({
                path:
                  "user",

                select:
                  "fullName phone isActive isVerified verificationSource",
              })
          : await Farmer
              .findById(
                partnerId
              )
              .populate({
                path:
                  "user",

                select:
                  "fullName phone isActive isVerified verificationSource",
              });

      if (
        !partner ||
        !partner.user ||
        !partner.user
          .isActive
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Partner not found.",
          });
      }

      const farmerId =
        current.type ===
        "farmer"
          ? current
              .profile._id
          : partner._id;

      const millerId =
        current.type ===
        "miller"
          ? current
              .profile._id
          : partner._id;

      const relationship =
        await getRelationshipState({
          farmerId,
          millerId,
        });

      /*
       * A person can open Partner Details if:
       *
       * 1. They are connected
       * OR
       * 2. They have traded successfully
       */
      if (
        !relationship.isPartner
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "This marketplace user is not currently one of your partners.",
          });
      }

      const negotiationFilter =
        {
          farmerId,
          millerId,

          status:
            "agreed",
        };

      const negotiations =
        await Negotiation.find(
          negotiationFilter
        ).sort({
          createdAt: -1,
        });

      const summary =
        buildTradeSummary(
          negotiations
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

      const contactAccess =
        await getContactAccess({
          farmerId,
          millerId,
          relationship,
        });

      let contact =
        null;

      /*
       * IMPORTANT PHONE FIX
       *
       * partner.user is populated above,
       * so this is always the OTHER person's
       * User.phone.
       */
      if (
        contactAccess.unlocked
      ) {
        contact = {
          fullName:
            partner.user
              .fullName,

          phone:
            partner.user
              .phone,
        };
      }

      const opportunities =
        await getPartnerOpportunities({
          currentType:
            current.type,

          partner,

          connected:
            relationship.connected,
        });

      const transactions =
        negotiations.map(
          buildTransactionItem
        );

      return res
        .status(200)
        .json({
          success:
            true,

          data: {
            partner:
              buildSafePartnerProfile(
                partnerType,
                partner,
                partner.user
              ),

            relationship: {
              connected:
                relationship.connected,

              connectionId:
                relationship
                  .connection?._id ||
                null,

              connectionStatus:
                relationship
                  .connection
                  ?.status ||
                "none",

              hasTraded:
                relationship.hasTraded,
            },

            summary,

            isFavorite:
              Boolean(
                favorite
              ),

            contactUnlocked:
              contactAccess.unlocked,

            contactSource:
              contactAccess.source,

            contact,

            opportunities,

            transactions,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "GET PARTNER DETAILS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to retrieve partner details.",
        });
    }
  };

// ======================================================
// ADD FAVORITE
// ======================================================

const addFavoritePartner =
  async (
    req,
    res
  ) => {
    try {
      const {
        partnerType,
        partnerId,
      } =
        req.params;

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
            success:
              false,

            message:
              "Partner type must be farmer or miller.",
          });
      }

      if (
        !mongoose.Types
          .ObjectId
          .isValid(
            partnerId
          )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

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
            success:
              false,

            message:
              `${req.user.role} profile not found.`,
          });
      }

      const expectedPartnerType =
        getPartnerType(
          current.type
        );

      if (
        partnerType !==
        expectedPartnerType
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

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
            success:
              false,

            message:
              "Partner not found.",
          });
      }

      const farmerId =
        current.type ===
        "farmer"
          ? current
              .profile._id
          : partner._id;

      const millerId =
        current.type ===
        "miller"
          ? current
              .profile._id
          : partner._id;

      const relationship =
        await getRelationshipState({
          farmerId,
          millerId,
        });

      /*
       * Favourites now work for:
       *
       * - connected partners
       * - successful trade partners
       */
      if (
        !relationship.isPartner
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Only connected or successful trading partners can be saved as favourites.",
          });
      }

      const favorite =
        await FavoritePartner
          .findOneAndUpdate(
            {
              ownerType:
                current.type,

              ownerId:
                current
                  .profile._id,

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

              upsert:
                true,

              runValidators:
                true,
            }
          );

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Partner saved to favourites.",

          data: {
            favorite,

            isFavorite:
              true,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "ADD FAVORITE PARTNER ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.code ===
            11000
              ? "Partner is already saved."
              : error.message ||
                "Failed to save partner.",
        });
    }
  };

// ======================================================
// REMOVE FAVORITE
// ======================================================

const removeFavoritePartner =
  async (
    req,
    res
  ) => {
    try {
      const {
        partnerType,
        partnerId,
      } =
        req.params;

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
            success:
              false,

            message:
              "Partner type must be farmer or miller.",
          });
      }

      if (
        !mongoose.Types
          .ObjectId
          .isValid(
            partnerId
          )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

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
            success:
              false,

            message:
              `${req.user.role} profile not found.`,
          });
      }

      await FavoritePartner
        .findOneAndDelete({
          ownerType:
            current.type,

          ownerId:
            current
              .profile._id,

          partnerType,

          partnerId,
        });

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Partner removed from favourites.",

          data: {
            isFavorite:
              false,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "REMOVE FAVORITE PARTNER ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

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