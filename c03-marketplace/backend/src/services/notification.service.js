const Notification = require(
  "../models/notification.model"
);

const createMarketplaceNotification =
  async ({
    recipientType,
    recipientId,
    actorType = "system",
    actorId = null,
    actorName = "Digital Goviya",
    type,
    titleEnglish,
    titleSinhala,
    messageEnglish,
    messageSinhala,
    relatedHarvestId = null,
    relatedSelectionId = null,
    relatedNegotiationId = null,
    relatedNegotiationCode = "",
    relatedContactRequestId = null,
  }) => {
    if (!recipientType || !recipientId || !type) {
      return null;
    }

    try {
      return await Notification.create({
        recipientType,
        recipientId,
        actorType,
        actorId,
        actorName,
        type,

        title: {
          english: titleEnglish,
          sinhala:
            titleSinhala || titleEnglish,
        },

        message: {
          english: messageEnglish,
          sinhala:
            messageSinhala || messageEnglish,
        },

        relatedHarvestId,
        relatedSelectionId,
        relatedNegotiationId,
        relatedNegotiationCode,
        relatedContactRequestId,
      });
    } catch (error) {
      /*
       * A notification failure should not break the main
       * marketplace operation.
       */
      console.error(
        "NOTIFICATION CREATE ERROR:",
        error
      );

      return null;
    }
  };

module.exports = {
  createMarketplaceNotification,
};
