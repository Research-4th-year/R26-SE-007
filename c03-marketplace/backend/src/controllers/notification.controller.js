const Notification = require(
    "../models/notification.model"
);

// Get notifications for a farmer or miller
const getNotifications = async (req, res) => {
    try {
        const {
            recipientType,
            recipientId
        } = req.params;

        if (
            !["farmer", "miller"].includes(
                recipientType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Recipient type must be farmer or miller."
            });
        }

        const notifications =
            await Notification.find({
                recipientType,
                recipientId
            })
                .sort({
                    createdAt: -1
                })
                .populate("relatedHarvestId")
                .populate("relatedSelectionId");

        const unreadCount =
            await Notification.countDocuments({
                recipientType,
                recipientId,
                isRead: false
            });

        return res.status(200).json({
            success: true,

            unreadCount,

            count: notifications.length,

            data: notifications
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark one notification as read
const markNotificationAsRead = async (
    req,
    res
) => {
    try {
        const { notificationId } = req.params;

        const notification =
            await Notification.findByIdAndUpdate(
                notificationId,
                {
                    isRead: true,
                    readAt: new Date()
                },
                {
                    new: true
                }
            );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        return res.status(200).json({
            success: true,

            message:
                "Notification marked as read.",

            data: notification
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (
    req,
    res
) => {
    try {
        const {
            recipientType,
            recipientId
        } = req.params;

        await Notification.updateMany(
            {
                recipientType,
                recipientId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        return res.status(200).json({
            success: true,
            message:
                "All notifications marked as read."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};