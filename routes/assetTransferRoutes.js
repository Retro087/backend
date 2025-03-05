const {
  confirmAssetTransferBuyer,
  confirmAssetTransferSeller,
  createAssetTransfer,
} = require("../controllers/assetTransferController");
const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", authenticateToken, createAssetTransfer);

//  Подтверждение получения активов покупателем (только для покупателей)
router.put("/:id/confirm-buyer", authenticateToken, confirmAssetTransferBuyer);

//  Подтверждение получения средств продавцом (только для продавцов)
router.put(
  "/:id/confirm-seller",
  authenticateToken,
  confirmAssetTransferSeller
);

module.exports = router;
