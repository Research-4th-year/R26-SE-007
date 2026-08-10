const mongoose = require("mongoose");

const ContactRequest = require(
  "../models/contactRequest.model"
);

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

/**
 * Resolve the logged-in marketplace profile.
 */
const getLoggedInProfile = async (
  user
) => {
  if (user.role === "farmer") {
    const farmer =
      await Farmer.findOne({
        user: user._id,
      });

    return {
      role: "farmer",
      profile: farmer,
    };
  }

  const miller =
    await Miller.findOne({
      user: user._id,
    });

  return {
    role: "miller",
    profile: miller,
  };
};

/**
 * Verify that the logged-in user belongs
 * to this negotiation.
 */
const verifyParticipant = (
  negotiation,
  role,
  profile
) => {
  if (!profile) {
    return false;
  }

  if (role === "farmer") {
    return (
      String(
        negotiation.farmerId
      ) ===
      String(profile._id)
    );
  }

  return (
    String(
      negotiation.millerId
    ) ===
    String(profile._id)
  );
};

/**
 * Build safe contact information.
 *
 * Only call this AFTER contact access
 * has been accepted.
 */
const buildContactData = async (
  negotiation
) => {
  const [
    farmer,
    miller,
  ] = await Promise.all([
    Farmer.findById(
      negotiation.farmerId
    ),

    Miller.findById(
      negotiation.millerId
    ),
  ]);

  if (!farmer || !miller) {
    throw new Error(
      "Marketplace participant profiles are unavailable."
    );
  }

  const [
    farmerUser,
    millerUser,
  ] = await Promise.all([
    User.findById(
      farmer.user
    ).select(
      "fullName phone"
    ),

    User.findById(
      miller.user
    ).select(
      "fullName phone"
    ),
  ]);

  if (
    !farmerUser ||
    !millerUser
  ) {
    throw new Error(
      "Participant contact information is unavailable."
    );
  }

  return {
    farmer: {
      name:
        farmerUser.fullName,

      farmerName:
        farmer.farmerName,

      phone:
        farmerUser.phone,

      district:
        farmer.district,

      location:
        farmer.location,
    },

    miller: {
      name:
        millerUser.fullName,

      millName:
        miller.millName,

      phone:
        millerUser.phone,

      district:
        miller.district,

      location:
        miller.location,
    },
  };
};

/**
 * POST /api/contact-requests
 *
 * {
 *   negotiationId: "Mongo negotiation _id"
 * }
 */
const createContactRequest =
  async (req, res) => {
    try {
      const {
        negotiationId,
      } = req.body;

      if (
        !negotiationId ||
        !mongoose.Types.ObjectId.isValid(
          negotiationId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "A valid negotiation ID is required.",
          });
      }

      const negotiation =
        await Negotiation.findById(
          negotiationId
        );

      if (!negotiation) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Negotiation not found.",
          });
      }

      if (
        negotiation.status !==
        "agreed"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Contact access is only available after a successful negotiation.",
          });
      }

      const {
        role,
        profile,
      } =
        await getLoggedInProfile(
          req.user
        );

      if (!profile) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              `${role} profile not found.`,
          });
      }

      if (
        !verifyParticipant(
          negotiation,
          role,
          profile
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "You are not a participant in this negotiation.",
          });
      }

      const existing =
        await ContactRequest.findOne({
          negotiationId:
            negotiation._id,
        });

      if (existing) {
        return res
          .status(200)
          .json({
            success: true,

            message:
              "A contact request already exists for this negotiation.",

            data: {
              request:
                existing,

              contactUnlocked:
                existing.status ===
                "accepted",
            },
          });
      }

      const request =
        await ContactRequest.create({
          negotiationId:
            negotiation._id,

          farmerId:
            negotiation.farmerId,

          millerId:
            negotiation.millerId,

          requestedBy:
            role,

          status:
            "pending",

          requestedAt:
            new Date(),
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            role === "farmer"
              ? "Contact request sent to the Miller."
              : "Contact request sent to the Farmer.",

          data: {
            request,

            contactUnlocked:
              false,
          },
        });
    } catch (error) {
      console.error(
        "CREATE CONTACT REQUEST ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Failed to create contact request.",
        });
    }
  };

/**
 * PATCH /api/contact-requests/:requestId/respond
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
const respondToContactRequest =
  async (req, res) => {
    try {
      const {
        requestId,
      } = req.params;

      const {
        decision,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          requestId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid contact request ID.",
          });
      }

      if (
        ![
          "accepted",
          "rejected",
        ].includes(decision)
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Decision must be accepted or rejected.",
          });
      }

      const request =
        await ContactRequest.findById(
          requestId
        );

      if (!request) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Contact request not found.",
          });
      }

      if (
        request.status !==
        "pending"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This contact request has already been processed.",
          });
      }

      const {
        role,
        profile,
      } =
        await getLoggedInProfile(
          req.user
        );

      if (!profile) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              `${role} profile not found.`,
          });
      }

      /*
       * The user who created the request
       * cannot approve their own request.
       */
      if (
        request.requestedBy ===
        role
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "The other participant must respond to the contact request.",
          });
      }

      if (
        role === "farmer" &&
        String(
          request.farmerId
        ) !==
          String(profile._id)
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "You are not authorized to respond to this contact request.",
          });
      }

      if (
        role === "miller" &&
        String(
          request.millerId
        ) !==
          String(profile._id)
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "You are not authorized to respond to this contact request.",
          });
      }

      request.status =
        decision;

      request.respondedAt =
        new Date();

      await request.save();

      let contact = null;

      if (
        decision ===
        "accepted"
      ) {
        const negotiation =
          await Negotiation.findById(
            request.negotiationId
          );

        if (!negotiation) {
          return res
            .status(409)
            .json({
              success: false,

              message:
                "The linked negotiation could not be found.",
            });
        }

        contact =
          await buildContactData(
            negotiation
          );
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            decision ===
            "accepted"
              ? "Contact access accepted. Phone and WhatsApp contact are now available to both participants."
              : "Contact request rejected.",

          data: {
            request,

            contactUnlocked:
              decision ===
              "accepted",

            contact,
          },
        });
    } catch (error) {
      console.error(
        "RESPOND CONTACT REQUEST ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Failed to respond to contact request.",
        });
    }
  };

/**
 * GET
 * /api/contact-requests/negotiation/:negotiationId
 *
 * Used by the Negotiation Result screen.
 */
const getContactRequestForNegotiation =
  async (req, res) => {
    try {
      const {
        negotiationId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          negotiationId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid negotiation ID.",
          });
      }

      const negotiation =
        await Negotiation.findById(
          negotiationId
        );

      if (!negotiation) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Negotiation not found.",
          });
      }

      const {
        role,
        profile,
      } =
        await getLoggedInProfile(
          req.user
        );

      if (!profile) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              `${role} profile not found.`,
          });
      }

      if (
        !verifyParticipant(
          negotiation,
          role,
          profile
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "You are not a participant in this negotiation.",
          });
      }

      const request =
        await ContactRequest.findOne({
          negotiationId:
            negotiation._id,
        });

      if (!request) {
        return res
          .status(200)
          .json({
            success: true,

            data: {
              exists: false,

              request: null,

              contactUnlocked:
                false,

              canRequest:
                negotiation.status ===
                "agreed",

              canRespond:
                false,

              contact: null,
            },
          });
      }

      const canRespond =
        request.status ===
          "pending" &&
        request.requestedBy !==
          role;

      const unlocked =
        request.status ===
        "accepted";

      let contact = null;

      if (unlocked) {
        contact =
          await buildContactData(
            negotiation
          );
      }

      return res
        .status(200)
        .json({
          success: true,

          data: {
            exists: true,

            request,

            contactUnlocked:
              unlocked,

            canRequest: false,

            canRespond,

            contact,
          },
        });
    } catch (error) {
      console.error(
        "GET CONTACT REQUEST ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Failed to retrieve contact access state.",
        });
    }
  };

module.exports = {
  createContactRequest,
  respondToContactRequest,
  getContactRequestForNegotiation,
};