const express = require("express");
const router = express.Router();
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getArticle,
  getDrafts,
  getStat,
} = require("../controllers/productController");
const authenticateToken = require("../middleware/authMiddleware");

// Защита всех маршрутов товаров

router.post("/", authenticateToken, createProduct);
router.get("/:sellerId/product/:productId", getStat);
router.get("/", getProducts);
router.get("/drafts", getDrafts);
router.get("/:id", getArticle);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
