const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require(
  "../middlewares/auth.middleware"
);

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require(
  "../controllers/notification.controller"
);

const router = express.Router();

router.use(authenticate);

router.use(
  authorizeRoles(
    "farmer",
    "miller"
  )
);

router.get(
  "/mine",
  getMyNotifications
);

router.patch(
  "/read-all",
  markAllNotificationsAsRead
);

router.patch(
  "/:notificationId/read",
  markNotificationAsRead
);

module.exports = router;
