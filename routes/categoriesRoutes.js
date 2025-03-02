const express = require("express");
const router = express.Router();
const { getCategory } = require("../controllers/categoriesController");

router.get("/", getCategory);

module.exports = router;
