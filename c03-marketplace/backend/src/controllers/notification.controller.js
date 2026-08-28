const mongoose = require("mongoose");

const Notification = require(
  "../models/notification.model"
);

const Farmer = require(
  "../models/farmer.model"
);

const Miller = require(
  "../models/miller.model"
);

const resolveCurrentRecipient = async (
  user
) => {
  if (user.role === "farmer") {
    const farmer = await Farmer.findOne({
      user: user._id,
    });

    return farmer
      ? {
          recipientType: "farmer",
          recipientId: farmer._id,
        }
      : null;
  }

  const miller = await Miller.findOne({
    user: user._id,
  });

  return miller
    ? {
        recipientType: "miller",
        recipientId: miller._id,
      }
    : null;
};

const getMyNotifications = async (
  req,
  res
) => {
  try {
    const recipient =
      await resolveCurrentRecipient(
        req.user
      );

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message:
          `${req.user.role} profile not found.`,
      });
    }

    const notifications =
      await Notification.find(
        recipient
      )
        .sort({
          createdAt: -1,
        })
        .limit(150);

    const unreadCount =
      await Notification.countDocuments({
        ...recipient,
        isRead: false,
      });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve notifications.",
    });
  }
};

const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const {
      notificationId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        notificationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid notification ID.",
      });
    }

    const recipient =
      await resolveCurrentRecipient(
        req.user
      );

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message:
          `${req.user.role} profile not found.`,
      });
    }

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          ...recipient,
        },
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update notification.",
    });
  }
};

const markAllNotificationsAsRead =
  async (req, res) => {
    try {
      const recipient =
        await resolveCurrentRecipient(
          req.user
        );

      if (!recipient) {
        return res.status(404).json({
          success: false,
          message:
            `${req.user.role} profile not found.`,
        });
      }

      await Notification.updateMany(
        {
          ...recipient,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update notifications.",
      });
    }
  };

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
