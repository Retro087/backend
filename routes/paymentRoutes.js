const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/", authenticateToken, paymentController.createPayment);
router.post("/:id/confirm", authenticateToken, paymentController.confirm); // Make sure this route exists
router.post("/yookassa/webhook", paymentController.yookassaWebhook);
module.exports = router;
