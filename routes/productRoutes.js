const express = require("express");
const router = express.Router();
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getArticle,
  getDrafts,
  addView,
  getStat,
  getMyProducts,
  updateProductStatus,
} = require("../controllers/productController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Защита всех маршрутов товаров

router.post("/", authenticateToken, createProduct);
router.post("/:id/view", addView);
router.get("/stats/:productId", authenticateToken, getStat);
router.get("/", getProducts);
router.get("/my", authenticateToken, getMyProducts);
router.get("/drafts", getDrafts);
router.get("/:id", getArticle);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id", updateProductStatus);

module.exports = router;
