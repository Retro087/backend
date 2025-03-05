const {
  getBuyerTransactions,
  getSellerTransactions,
} = require("../controllers/transactionController");
const { authenticateToken } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
router.get("/buyer", authenticateToken, getBuyerTransactions);

//  Получение истории продаж для авторизованного продавца
router.get("/seller", authenticateToken, getSellerTransactions);
module.exports = router;
