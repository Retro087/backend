const express = require("express");
const router = express.Router();
const {
  getCategory,
  addCategory,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoriesController");

router.get("/", getCategory);
router.post("/", addCategory);
router.delete("/:id", deleteCategory);
router.patch("/", updateCategory);
module.exports = router;
