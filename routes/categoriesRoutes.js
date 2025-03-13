const express = require("express");
const router = express.Router();
const {
  getCategory,
  addCategory,
} = require("../controllers/categoriesController");

router.get("/", getCategory);
router.post("/", addCategory);

module.exports = router;
