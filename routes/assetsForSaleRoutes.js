// routes/assetsRoutes.js
const express = require("express");
const {
  saveAssetForSale,
  getAssetForSale,
} = require("../controllers/assetsForSaleController");
const router = express.Router();

// Маршрут для сохранения/обновления данных
router.post("/save", saveAssetForSale);

// Маршрут для получения данных по бизнесу
router.get("/:businessId", getAssetForSale);

module.exports = router;
