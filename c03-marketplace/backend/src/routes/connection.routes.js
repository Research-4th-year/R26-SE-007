const express = require(
  "express"
);

const {
  authenticate,
  authorizeRoles,
} = require(
  "../middlewares/auth.middleware"
);

const {
  searchMarketplaceUsers,
  getPublicProfile,
  sendConnectionRequest,
  respondToConnection,
  getMyConnections,
  removeConnection,
  cancelConnectionRequest,
} = require(
  "../controllers/connection.controller"
);

const router =
  express.Router();

/*
 * Everything under /connections
 * requires marketplace login.
 */
router.use(
  authenticate
);

router.use(
  authorizeRoles(
    "farmer",
    "miller"
  )
);

// Search opposite marketplace role.
router.get(
  "/search",
  searchMarketplaceUsers
);

// Logged-in user's requests/connections.
router.get(
  "/mine",
  getMyConnections
);

// Safe public profile.
router.get(
  "/profile/:partnerType/:partnerId",
  getPublicProfile
);

// Send new connection request.
router.post(
  "/request/:partnerType/:partnerId",
  sendConnectionRequest
);

// Accept / reject incoming request.
router.patch(
  "/:connectionId/respond",
  respondToConnection
);

// Remove existing accepted relationship.
router.patch(
  "/:connectionId/remove",
  removeConnection
);

//Cancel existing pending connection request.
router.patch(
  "/:connectionId/cancel",
  cancelConnectionRequest
);
module.exports =
  router;