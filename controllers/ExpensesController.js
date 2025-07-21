const Expenses = require("../models/Expenses");
const Products = require("../models/Products");

// 1. Создание расхода (POST /expenses)
exports.createExpense = async (req, res) => {
  // Валидация запроса (подробности ниже)

  const { businessId, amount, title } = req.body;

  try {
    // Проверка существования бизнеса
    const business = await Products.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ message: "Бизнес не найден" });
    }

    const newExpense = await Expenses.create({
      businessId,

      amount,
      title,
    });

    res
      .status(201)
      .json({ message: "Расход успешно создан", expense: newExpense });
  } catch (error) {
    console.error("Ошибка при создании расхода:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// 2. Получение всех расходов (GET /expenses)
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expenses.findAll({
      include: [
        { model: Business, as: "business" }, // Включаем связанные модели (бизнес)
        { model: ExpenseCategory, as: "category" }, // Включаем связанные модели (категория)
      ],
      order: [["date", "DESC"]], // Сортировка по дате убыванию
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
  const { id } = req.params;
  const {
    businessId,
    categoryId,
    date,
    amount,
    description,
    paymentMethod,
    receiptUrl,
  } = req.body;

  try {
    // Проверка существования расхода
    const expense = await Expenses.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: "Расход не найден" });
    }

    // Проверка существования бизнеса
    if (businessId) {
      const business = await Products.findByPk(businessId);
      if (!business) {
        return res.status(404).json({ message: "Бизнес не найден" });
      }
    }

    // Обновление полей (если они были предоставлены)
    if (businessId !== undefined) expense.businessId = businessId;
    if (categoryId !== undefined) expense.categoryId = categoryId;
    if (date !== undefined) expense.date = date;
    if (amount !== undefined) expense.amount = amount;
    if (description !== undefined) expense.description = description;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl;

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

    res.status(200).json({ message: "Расход успешно удален" });
  } catch (error) {
    console.error("Ошибка при удалении расхода:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
