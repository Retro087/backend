const Expenses = require("../models/Expenses");
const Products = require("../models/Products");

// 1. Создание расхода (POST /expenses/:id)
exports.createExpense = async (req, res) => {
  // Предполагается, что в теле запроса приходит объект expense
  const { expense } = req.body;
  const businessId = req.params.id;
  console.log(expense, businessId);
  if (!expense || typeof expense !== "object") {
    return res
      .status(400)
      .json({ message: "Должен быть передан объект expense" });
  }

  const { title, amount } = expense;

  // if (!title || amount === undefined || amount === null) {
  //   return res.status(400).json({ message: "Поля title и amount обязательны" });
  // }

  try {
    // Проверка существования бизнеса
    const business = await Products.findByPk(businessId);

    if (!business) {
      return res.status(404).json({ message: "Бизнес не найден" });
    }

    const newExpense = await Expenses.create({
      businessId,
      title,
      amount,
    });

    res.status(201).json({
      message: "Расход успешно создан",
      expense: newExpense,
    });
  } catch (error) {
    console.error("Ошибка при создании расхода:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
// 2. Получение всех расходов (GET /expenses)
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expenses.findAll({
      where: { businessId: req.params.id },
      // Сортировка по дате убыванию
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Ошибка при получении расходов:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 3. Получение расхода по ID (GET /expenses/:id)
exports.getExpenseById = async (req, res) => {
  const { id } = req.params; // Получаем ID из параметров запроса

  try {
    const expense = await Expenses.findByPk(id, {
      include: [
        { model: Business, as: "business" },
        { model: ExpenseCategory, as: "category" },
      ],
    });

    if (!expense) {
      return res.status(404).json({ message: "Расход не найден" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error("Ошибка при получении расхода по ID:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 4. Обновление расхода (PUT /expenses/:id)
exports.updateExpense = async (req, res) => {
  const expenseData = req.body.expense; // предполагается, что весь объект expense передается
  console.log(expenseData);
  try {
    // Проверка существования расхода
    const expense = await Expenses.findByPk(expenseData.id);
    if (!expense) {
      return res.status(404).json({ message: "Расход не найден" });
    }

    // Обновляем все поля, переданные в expenseData
    Object.assign(expense, expenseData);

    await expense.save(); // Сохраняем изменения

    res.status(200).json({ message: "Расход успешно обновлен", expense });
  } catch (error) {
    console.error("Ошибка при обновлении расхода:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
// 5. Удаление расхода (DELETE /expenses/:id)
exports.deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const expense = await Expenses.findByPk(id);

    if (!expense) {
      return res.status(404).json({ message: "Расход не найден" });
    }

    await expense.destroy(); // Удаляем запись

    res.status(200).json({ message: "Расход успешно удален", id });
  } catch (error) {
    console.error("Ошибка при удалении расхода:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
