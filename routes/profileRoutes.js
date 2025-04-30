const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const {
  updateProfile,
  getProfile,
  updatePhoto,
  updatePicture,
} = require("../controllers/profileController");
const upload = require("../middleware/upload");

// Защита всех маршрутов товаров
router.use(authenticateToken);
router.patch("/", updateProfile);

router.get("/", getProfile);
router.post("/:id/photo", upload.single("updatePicture"), updatePicture);
module.exports = router;
