const express = require("express");
const router = express.Router();
const {
  register,
  login,
  authMe,
  refreshToken,
  logout,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.delete("/logout", logout);
router.get("/authMe", authenticateToken, authMe);
router.post("/refresh-token", refreshToken);
module.exports = router;
