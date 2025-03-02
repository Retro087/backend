const express = require("express");
const router = express.Router();
const { register, login, authMe } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/authMe", authenticateToken, authMe);

module.exports = router;
