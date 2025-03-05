const {
  getNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");
const {
  getBuyerTransactions,
  getSellerTransactions,
} = require("../controllers/transactionController");
const { authenticateToken } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

router.get("/", authenticateToken, getNotifications);

//  Отметить уведомление как прочитанное
router.put("/:id/read", authenticateToken, markNotificationAsRead);

module.exports = router;
