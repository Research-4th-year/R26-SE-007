const express = require("express");

const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require(
    "../controllers/notification.controller"
);

const router = express.Router();

// Get farmer or miller notifications
router.get(
    "/:recipientType/:recipientId",
    getNotifications
);

// Mark one notification as read
router.patch(
    "/:notificationId/read",
    markNotificationAsRead
);

// Mark all notifications as read
router.patch(
    "/:recipientType/:recipientId/read-all",
    markAllNotificationsAsRead
);

module.exports = router;