const express = require("express");
const router = express.Router();
const {
  createFavorite,
  getFavorite,
  deleteFavorite,
} = require("../controllers/favoriteController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Защита всех маршрутов товаров
router.use(authenticateToken);
router.get("/", getFavorite);
router.post("/:id", createFavorite);
router.delete("/:id", deleteFavorite);

module.exports = router;
