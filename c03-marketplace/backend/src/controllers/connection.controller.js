const mongoose = require(
  "mongoose"
);

const Connection = require(
  "../models/connection.model"
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

// ======================================================
// HELPERS
// ======================================================

function escapeRegex(
  value = ""
) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

async function getCurrentProfile(
  user
) {
  if (
    user.role ===
    "farmer"
  ) {
    const farmer =
      await Farmer.findOne({
        user: user._id,
      });

    if (!farmer) {
      return null;
    }

    return {
      type: "farmer",
      profile: farmer,
    };
  }

  if (
    user.role ===
    "miller"
  ) {
    const miller =
      await Miller.findOne({
        user: user._id,
      });

    if (!miller) {
      return null;
    }

    return {
      type: "miller",
      profile: miller,
    };
  }

  return null;
}

function getOppositeRole(
  role
) {
  return role ===
    "farmer"
    ? "miller"
    : "farmer";
}

function buildFarmerPublicProfile(
  farmer,
  user = null
) {
  return {
    id:
      farmer._id,

    type:
      "farmer",

    name:
      farmer.farmerName,

    farmerName:
      farmer.farmerName,

    district:
      farmer.district,

    location:
      farmer.location,

    farmName:
      farmer.farmName,

    farmSizeAcres:
      farmer.farmSizeAcres,

    mainPaddyVariety:
      farmer
        .mainPaddyVariety,

    isVerified:
      Boolean(
        user?.isVerified
      ),

    verificationSource:
      user?.verificationSource ||
      "NONE",
  };
}

function buildMillerPublicProfile(
  miller,
  user = null
) {
  return {
    id:
      miller._id,

    type:
      "miller",

    name:
      miller.millName ||
      miller.name,

    personName:
      miller.name,

    millName:
      miller.millName,

    district:
      miller.district,

    location:
      miller.location,

    businessRegistrationNumber:
      miller
        .businessRegistrationNumber,

    purchasingCapacityKg:
      miller
        .purchasingCapacityKg,

    isVerified:
      Boolean(
        user?.isVerified
      ),

    verificationSource:
      user?.verificationSource ||
      "NONE",
  };
}

/*
 * Return connection state from the
 * logged-in user's point of view.
 */
function buildConnectionState(
  connection,
  currentRole
) {
  if (!connection) {
    return {
      connectionId:
        null,

      status:
        "none",

      direction:
        null,

      canSendRequest:
        true,

      canRespond:
        false,
    };
  }

  const isRequester =
    connection.requestedBy ===
    currentRole;

  if (
    connection.status ===
    "pending"
  ) {
    return {
      connectionId:
        connection._id,

      status:
        "pending",

      direction:
        isRequester
          ? "outgoing"
          : "incoming",

      canSendRequest:
        false,

      canRespond:
        !isRequester,
    };
  }

  if (
    connection.status ===
    "accepted"
  ) {
    return {
      connectionId:
        connection._id,

      status:
        "accepted",

      direction:
        null,

      canSendRequest:
        false,

      canRespond:
        false,
    };
  }

  return {
    connectionId:
      connection._id,

    status:
      connection.status,

    direction:
      null,

    /*
     * A rejected or removed relationship
     * can later be requested again.
     */
    canSendRequest:
      true,

    canRespond:
      false,
  };
}

// ======================================================
// SEARCH
// ======================================================

/*
 * GET /api/connections/search
 *
 * Farmer → Millers only
 * Miller → Farmers only
 *
 * Optional:
 *
 * ?q=perera
 * ?district=Ampara
 */
const searchMarketplaceUsers =
  async (
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

      const q =
        String(
          req.query.q ||
          ""
        ).trim();

      const district =
        String(
          req.query.district ||
          ""
        ).trim();

      const safeQuery =
        escapeRegex(q);

      let profiles = [];

      // ===============================================
      // FARMER SEARCHING MILLERS
      // ===============================================

      if (
        current.type ===
        "farmer"
      ) {
        const filter = {};

        if (q) {
          filter.$or = [
            {
              name: {
                $regex:
                  safeQuery,

                $options:
                  "i",
              },
            },

            {
              millName: {
                $regex:
                  safeQuery,

                $options:
                  "i",
              },
            },

            {
              location: {
                $regex:
                  safeQuery,

                $options:
                  "i",
              },
            },
          ];
        }

        if (district) {
          filter.district = {
            $regex:
              `^${escapeRegex(
                district
              )}$`,

            $options:
              "i",
          };
        }

        profiles =
          await Miller.find(
            filter
          )
            .populate({
              path: "user",

              select:
                "isActive isVerified verificationSource",
            })
            .sort({
              millName: 1,
            })
            .limit(100);
      }

      // ===============================================
      // MILLER SEARCHING FARMERS
      // ===============================================

      if (
        current.type ===
        "miller"
      ) {
        const filter = {};

        if (q) {
          filter.$or = [
            {
              farmerName: {
                $regex:
                  safeQuery,

                $options:
                  "i",
              },
            },

            {
              farmName: {
                $regex:
                  safeQuery,

                $options:
                  "i",
              },
            },

            {
              location: {
                $regex:
                  safeQuery,

                $options:
                  "i",
              },
            },

            {
              mainPaddyVariety:
                {
                  $regex:
                    safeQuery,

                  $options:
                    "i",
                },
            },
          ];
        }

        if (district) {
          filter.district = {
            $regex:
              `^${escapeRegex(
                district
              )}$`,

            $options:
              "i",
          };
        }

        profiles =
          await Farmer.find(
            filter
          )
            .populate({
              path: "user",

              select:
                "isActive isVerified verificationSource",
            })
            .sort({
              farmerName:
                1,
            })
            .limit(100);
      }

      /*
       * Ignore profiles whose User account
       * is disabled or missing.
       */
      const activeProfiles =
        profiles.filter(
          (profile) =>
            profile.user &&
            profile.user
              .isActive
        );

      const oppositeRole =
        getOppositeRole(
          current.type
        );

      const targetIds =
        activeProfiles.map(
          (profile) =>
            profile._id
        );

      let connections = [];

      if (
        targetIds.length >
        0
      ) {
        connections =
          await Connection.find(
            current.type ===
            "farmer"
              ? {
                  farmerId:
                    current
                      .profile
                      ._id,

                  millerId:
                    {
                      $in:
                        targetIds,
                    },
                }
              : {
                  millerId:
                    current
                      .profile
                      ._id,

                  farmerId:
                    {
                      $in:
                        targetIds,
                    },
                }
          );
      }

      const connectionMap =
        new Map();

      for (
        const connection
        of connections
      ) {
        const targetId =
          current.type ===
          "farmer"
            ? String(
                connection
                  .millerId
              )
            : String(
                connection
                  .farmerId
              );

        connectionMap.set(
          targetId,
          connection
        );
      }

      const data =
        activeProfiles.map(
          (profile) => {
            const connection =
              connectionMap.get(
                String(
                  profile._id
                )
              );

            const publicProfile =
              oppositeRole ===
              "miller"
                ? buildMillerPublicProfile(
                    profile,
                    profile.user
                  )
                : buildFarmerPublicProfile(
                    profile,
                    profile.user
                  );

            return {
              profile:
                publicProfile,

              connection:
                buildConnectionState(
                  connection,
                  current.type
                ),
            };
          }
        );

      return res
        .status(200)
        .json({
          success:
            true,

          count:
            data.length,

          searchingFor:
            oppositeRole,

          data,
        });
    } catch (
      error
    ) {
      console.error(
        "SEARCH MARKETPLACE USERS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to search marketplace users.",
        });
    }
  };

// ======================================================
// PUBLIC PROFILE
// ======================================================

/*
 * GET
 * /api/connections/profile/:partnerType/:partnerId
 */
const getPublicProfile =
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

      const expectedRole =
        getOppositeRole(
          current.type
        );

      if (
        partnerType !==
        expectedRole
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              `A ${current.type} can only view ${expectedRole} profiles.`,
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
              "Invalid profile ID.",
          });
      }

      let partner;

      if (
        partnerType ===
        "farmer"
      ) {
        partner =
          await Farmer
            .findById(
              partnerId
            )
            .populate({
              path: "user",

              select:
                "fullName phone isActive isVerified verificationSource",
            });
      } else {
        partner =
          await Miller
            .findById(
              partnerId
            )
            .populate({
              path: "user",

              select:
                "fullName phone isActive isVerified verificationSource",
            });
      }

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
              "Marketplace profile not found.",
          });
      }

      const connection =
        await Connection.findOne(
          current.type ===
          "farmer"
            ? {
                farmerId:
                  current
                    .profile
                    ._id,

                millerId:
                  partner._id,
              }
            : {
                millerId:
                  current
                    .profile
                    ._id,

                farmerId:
                  partner._id,
              }
        );

      const connectionState =
        buildConnectionState(
          connection,
          current.type
        );

      const publicProfile =
        partnerType ===
        "farmer"
          ? buildFarmerPublicProfile(
              partner,
              partner.user
            )
          : buildMillerPublicProfile(
              partner,
              partner.user
            );

      /*
       * Contact information is returned
       * ONLY after connection acceptance.
       */
      const contact =
        connection?.status ===
        "accepted"
          ? {
              fullName:
                partner.user
                  .fullName,

              phone:
                partner.user
                  .phone,
            }
          : null;

      return res
        .status(200)
        .json({
          success:
            true,

          data: {
            profile:
              publicProfile,

            connection:
              connectionState,

            contactUnlocked:
              Boolean(
                contact
              ),

            contact,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "GET PUBLIC PROFILE ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to load marketplace profile.",
        });
    }
  };

// ======================================================
// SEND REQUEST
// ======================================================

/*
 * POST
 * /api/connections/request/:partnerType/:partnerId
 */
const sendConnectionRequest =
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

      const expectedRole =
        getOppositeRole(
          current.type
        );

      if (
        partnerType !==
        expectedRole
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              `A ${current.type} can only connect with ${expectedRole}s.`,
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
              "Invalid profile ID.",
          });
      }

      let partner;

      if (
        partnerType ===
        "farmer"
      ) {
        partner =
          await Farmer.findById(
            partnerId
          );
      } else {
        partner =
          await Miller.findById(
            partnerId
          );
      }

      if (!partner) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Marketplace profile not found.",
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

      let connection =
        await Connection.findOne({
          farmerId,
          millerId,
        });

      if (
        connection?.status ===
        "accepted"
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "You are already connected with this marketplace user.",
          });
      }

      if (
        connection?.status ===
        "pending"
      ) {
        /*
         * Useful special case:
         *
         * If the OTHER person has already
         * sent a pending request, the user
         * should accept that request instead
         * of creating another one.
         */
        if (
          connection.requestedBy !==
          current.type
        ) {
          return res
            .status(409)
            .json({
              success:
                false,

              message:
                "This user has already sent you a connection request. Accept or reject the existing request.",

              data: {
                connectionId:
                  connection._id,

                direction:
                  "incoming",
              },
            });
        }

        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "Connection request already sent.",
          });
      }

      if (connection) {
        /*
         * Re-use rejected/removed record.
         */
        connection.requestedBy =
          current.type;

        connection.status =
          "pending";

        connection.requestedAt =
          new Date();

        connection.respondedAt =
          null;

        connection.removedAt =
          null;

        await connection.save();
      } else {
        connection =
          await Connection.create({
            farmerId,

            millerId,

            requestedBy:
              current.type,

            status:
              "pending",
          });
      }

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            "Connection request sent.",

          data: {
            connection,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "SEND CONNECTION REQUEST ERROR:",
        error
      );

      if (
        error.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "A connection already exists between these users.",
          });
      }

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to send connection request.",
        });
    }
  };

// ======================================================
// RESPOND TO REQUEST
// ======================================================

/*
 * PATCH
 * /api/connections/:connectionId/respond
 *
 * body:
 *
 * {
 *   decision: "accepted"
 * }
 *
 * OR
 *
 * {
 *   decision: "rejected"
 * }
 */
const respondToConnection =
  async (
    req,
    res
  ) => {
    try {
      const {
        connectionId,
      } =
        req.params;

      const {
        decision,
      } =
        req.body;

      if (
        ![
          "accepted",
          "rejected",
        ].includes(
          decision
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Decision must be accepted or rejected.",
          });
      }

      if (
        !mongoose.Types
          .ObjectId
          .isValid(
            connectionId
          )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid connection ID.",
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

      const connection =
        await Connection.findById(
          connectionId
        );

      if (
        !connection
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Connection request not found.",
          });
      }

      if (
        connection.status !==
        "pending"
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "This connection request has already been processed.",
          });
      }

      /*
       * Request sender cannot accept
       * their own request.
       */
      if (
        connection.requestedBy ===
        current.type
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You cannot respond to your own outgoing request.",
          });
      }

      const belongsToUser =
        current.type ===
        "farmer"
          ? String(
              connection
                .farmerId
            ) ===
            String(
              current
                .profile._id
            )
          : String(
              connection
                .millerId
            ) ===
            String(
              current
                .profile._id
            );

      if (
        !belongsToUser
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You are not allowed to respond to this request.",
          });
      }

      connection.status =
        decision;

      connection.respondedAt =
        new Date();

      await connection.save();

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            decision ===
            "accepted"
              ? "Connection request accepted."
              : "Connection request rejected.",

          data: {
            connection,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "RESPOND CONNECTION ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to respond to connection request.",
        });
    }
  };

// ======================================================
// GET MY CONNECTIONS / REQUESTS
// ======================================================

/*
 * GET /api/connections/mine
 *
 * Optional:
 *
 * ?status=pending
 * ?status=accepted
 */
const getMyConnections =
  async (
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

      const requestedStatus =
        String(
          req.query.status ||
          ""
        ).trim();

      const filter =
        current.type ===
        "farmer"
          ? {
              farmerId:
                current
                  .profile
                  ._id,
            }
          : {
              millerId:
                current
                  .profile
                  ._id,
            };

      if (
        requestedStatus &&
        [
          "pending",
          "accepted",
          "rejected",
          "removed",
        ].includes(
          requestedStatus
        )
      ) {
        filter.status =
          requestedStatus;
      }

      const connections =
        await Connection.find(
          filter
        )
          .populate({
            path:
              "farmerId",

            populate: {
              path:
                "user",

              select:
                "isActive isVerified verificationSource",
            },
          })
          .populate({
            path:
              "millerId",

            populate: {
              path:
                "user",

              select:
                "isActive isVerified verificationSource",
            },
          })
          .sort({
            updatedAt:
              -1,
          });

      const data =
        connections.map(
          (
            connection
          ) => {
            const partner =
              current.type ===
              "farmer"
                ? connection
                    .millerId
                : connection
                    .farmerId;

            const partnerType =
              getOppositeRole(
                current.type
              );

            const profile =
              partnerType ===
              "miller"
                ? buildMillerPublicProfile(
                    partner,
                    partner?.user
                  )
                : buildFarmerPublicProfile(
                    partner,
                    partner?.user
                  );

            return {
              connectionId:
                connection._id,

              status:
                connection.status,

              requestedBy:
                connection
                  .requestedBy,

              direction:
                connection
                  .status ===
                "pending"
                  ? connection
                      .requestedBy ===
                    current.type
                    ? "outgoing"
                    : "incoming"
                  : null,

              requestedAt:
                connection
                  .requestedAt,

              respondedAt:
                connection
                  .respondedAt,

              partner:
                profile,
            };
          }
        );

      return res
        .status(200)
        .json({
          success:
            true,

          count:
            data.length,

          data,
        });
    } catch (
      error
    ) {
      console.error(
        "GET CONNECTIONS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to retrieve connections.",
        });
    }
  };

// ======================================================
// REMOVE CONNECTION
// ======================================================

/*
 * PATCH
 * /api/connections/:connectionId/remove
 */
const removeConnection =
  async (
    req,
    res
  ) => {
    try {
      const {
        connectionId,
      } =
        req.params;

      if (
        !mongoose.Types
          .ObjectId
          .isValid(
            connectionId
          )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid connection ID.",
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

      const connection =
        await Connection.findById(
          connectionId
        );

      if (
        !connection
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Connection not found.",
          });
      }

      const belongsToUser =
        current.type ===
        "farmer"
          ? String(
              connection
                .farmerId
            ) ===
            String(
              current
                .profile._id
            )
          : String(
              connection
                .millerId
            ) ===
            String(
              current
                .profile._id
            );

      if (
        !belongsToUser
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You are not allowed to remove this connection.",
          });
      }

      if (
        connection.status !==
        "accepted"
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "Only accepted connections can be removed.",
          });
      }

      connection.status =
        "removed";

      connection.removedAt =
        new Date();

      await connection.save();

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Connection removed.",

          data: {
            connection,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "REMOVE CONNECTION ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to remove connection.",
        });
    }
  };

  const cancelConnectionRequest =
  async (
    req,
    res
  ) => {
    try {
      const {
        connectionId,
      } = req.params;

      if (
        !mongoose.Types
          .ObjectId
          .isValid(
            connectionId
          )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid connection ID.",
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

      const connection =
        await Connection.findById(
          connectionId
        );

      if (!connection) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Connection request not found.",
          });
      }

      if (
        connection.status !==
        "pending"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Only pending connection requests can be cancelled.",
          });
      }

      /*
       * Only the original sender
       * can cancel the request.
       */
      if (
        connection.requestedBy !==
        current.type
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "You cannot cancel an incoming request.",
          });
      }

      const belongsToCurrentUser =
        current.type ===
        "farmer"
          ? String(
              connection
                .farmerId
            ) ===
            String(
              current
                .profile
                ._id
            )
          : String(
              connection
                .millerId
            ) ===
            String(
              current
                .profile
                ._id
            );

      if (
        !belongsToCurrentUser
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "You are not allowed to cancel this request.",
          });
      }

      /*
       * We keep the relationship
       * record for history instead
       * of deleting it.
       */
      connection.status =
        "removed";

      connection.removedAt =
        new Date();

      connection.respondedAt =
        null;

      await connection.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Connection request cancelled.",

          data: {
            connectionId:
              connection._id,

            status:
              connection.status,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "CANCEL CONNECTION REQUEST ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Failed to cancel connection request.",
        });
    }
  };

module.exports = {
  searchMarketplaceUsers,
  getPublicProfile,
  sendConnectionRequest,
  respondToConnection,
  getMyConnections,
  removeConnection,
  cancelConnectionRequest,
};