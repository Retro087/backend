const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/ExpensesController"); // Путь к вашему контроллеру

router.post("/", expenseController.createExpense);

// 2. Получение всех расходов (GET /expenses)
router.get("/", expenseController.getAllExpenses);

// 3. Получение расхода по ID (GET /expenses/:id)
router.get("/:id", expenseController.getExpenseById);

// 4. Обновление расхода (PUT /expenses/:id)
router.put("/:id", expenseController.updateExpense);

// 5. Удаление расхода (DELETE /expenses/:id)
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
