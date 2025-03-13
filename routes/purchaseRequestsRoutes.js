const express = require("express");
const router = express.Router();

//Укажите правильный путь к вашим middleware
const {
  createPurchaseRequest,
  updatePurchaseRequestStatus,
  deletePurchaseRequest,
  getAllPurchaseRequests,
  acceptPurchaseRequest,
  rejectPurchaseRequest,
  getPurchaseRequest,
} = require("../controllers/PurchaseRequestController");
const { isOwnerOrAdmin } = require("../middleware/isOwnerOrAdmin");
const { authenticateToken } = require("../middleware/authMiddleware");

// Создание запроса на покупку (требует аутентификации)
router.post("/", authenticateToken, createPurchaseRequest);

// Получение всех запросов на покупку (требует аутентификации и роли администратора)
router.get("/", authenticateToken, getAllPurchaseRequests);
router.get("/:productId", authenticateToken, getPurchaseRequest);

// Удаление запроса на покупку (требует аутентификации и роли администратора)
router.delete("/:id", authenticateToken, deletePurchaseRequest);

//Обновление статуса запроса на покупку (требует аутентификации и роли администратора)
router.put("/:id/accept", authenticateToken, acceptPurchaseRequest);

//  Отклонение запроса на покупку продавцом (только для продавцов)
router.put("/:id/reject", authenticateToken, rejectPurchaseRequest);

module.exports = router;
