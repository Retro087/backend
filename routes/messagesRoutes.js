const express = require("express");
const router = express.Router();
const {
  getMessages,
  createMessage,
  deleteFavorite,
} = require("../controllers/messagesController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Защита всех маршрутов товаров

module.exports = router;
