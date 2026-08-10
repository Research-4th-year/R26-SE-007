const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["farmer", "miller"],
      required: true,
      index: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    actorType: {
      type: String,
      enum: ["farmer", "miller", "system"],
      default: "system",
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    actorName: {
      type: String,
      trim: true,
      default: "Digital Goviya",
    },

    type: {
      type: String,
      enum: [
        "MATCH_REQUEST",
        "MATCH_ACCEPTED",
        "MATCH_REJECTED",
        "NEGOTIATION_READY",
        "NEGOTIATION_AGREED",
        "NEGOTIATION_FAILED",
        "CONTACT_REQUEST",
        "CONTACT_ACCEPTED",
        "CONTACT_REJECTED",
      ],
      required: true,
      index: true,
    },

    title: {
      english: {
        type: String,
        required: true,
      },
      sinhala: {
        type: String,
        required: true,
      },
    },

    message: {
      english: {
        type: String,
        required: true,
      },
      sinhala: {
        type: String,
        required: true,
      },
    },

    relatedHarvestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Harvest",
      default: null,
    },

    relatedSelectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatchSelection",
      default: null,
    },

    relatedNegotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negotiation",
      default: null,
    },

    relatedNegotiationCode: {
      type: String,
      default: "",
      trim: true,
    },

    relatedContactRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContactRequest",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({
  recipientType: 1,
  recipientId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
