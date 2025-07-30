const express = require("express");
const {
  createExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
} = require("../controllers/ExpensesController");
const router = express.Router();

router.post("/:id", createExpense);
router.get("/:id", getAllExpenses);
router.put("/", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
