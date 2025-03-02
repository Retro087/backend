const express = require("express");
const router = express.Router();

const {
  authenticateToken,
  authorizeRole,
} = require("../middleware/authMiddleware");
const {
  getAllUsers,
  adminUpdateProfile,
  adminDeleteProfile,
  adminCreateUser,
  getAllProducts,
  adminUpdateProduct,
  adminDeleteProduct,
} = require("../controllers/adminController");

// Защита всех маршрутов товаров

router.get("/users", authenticateToken, authorizeRole("admin"), getAllUsers);
router.patch(
  "/users/:id",
  authenticateToken,
  authorizeRole("admin"),
  adminUpdateProfile
);
router.delete(
  "/users/:id",
  authenticateToken,
  authorizeRole("admin"),
  adminDeleteProfile
);
router.post(
  "/users",
  authenticateToken,
  authorizeRole("admin"),
  adminCreateUser
);
router.get(
  "/products",
  authenticateToken,
  authorizeRole("admin"),
  getAllProducts
);

// Обновление продукта (только для администраторов)
router.patch(
  "/products/:id",
  authenticateToken,
  authorizeRole("admin"),
  adminUpdateProduct
);

// Удаление продукта (только для администраторов)
router.delete(
  "/products/:id",
  authenticateToken,
  authorizeRole("admin"),
  adminDeleteProduct
);

module.exports = router;
