const express = require("express");
const {
  createExpenses,
  getAllExpenses,
} = require("../controllers/ExpensesController");
const router = express.Router();

router.post("/:id", createExpenses);
router.get("/:id", getAllExpenses);

module.exports = router;
