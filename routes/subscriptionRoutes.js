const express = require("express");
const router = express.Router();
const Subscription = require("../models/Subscription");
const {
  createSubscription,
  getAllSubscriptions,
  deleteSubscription,
  updateSubscription,
  extendSubscription,
  cancelSubscription,
  checkSubscriptionStatus,
  updateExpiredSubscriptions,
  getSubscriptionDetails,
} = require("../controllers/subscriptionController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Защита всех маршрутов подписок
router.use(authenticateToken);

router.get("/", getAllSubscriptions);

router.post("/", createSubscription);

router.delete("/:id", deleteSubscription);

router.put("/subscriptions", updateSubscription);

router.post("/subscriptions/extend", extendSubscription);

router.delete("/subscriptions/cancel", cancelSubscription);

router.get("/subscriptions/status", checkSubscriptionStatus);

router.post("/subscriptions/update-expired", updateExpiredSubscriptions);

router.get("/subscriptions", getUserSubscriptions);

router.get("/subscriptions/:subscriptionId", getSubscriptionDetails);

module.exports = router;
