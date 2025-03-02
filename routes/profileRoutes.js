const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const {
  updateProfile,
  getProfile,
  updatePhoto,
} = require("../controllers/profileController");
const upload = require("../middleware/upload");

// Защита всех маршрутов товаров
router.use(authenticateToken);
router.patch("/", updateProfile);

router.get("/", getProfile);

module.exports = router;
