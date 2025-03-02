const express = require("express");
const router = express.Router();

const { getChats, createChat } = require("../controllers/chatController");
const {
  getMessages,
  createMessage,
  getUnreadCounts,
} = require("../controllers/messagesController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Защита всех маршрутов товаров
router.get("/unreadCount", authenticateToken, getUnreadCounts);
router.get("/", authenticateToken, getChats);
router.post("/", authenticateToken, createChat);
router.get("/:id", authenticateToken, getMessages);

router.post("/createMessage", createMessage);
module.exports = router;
