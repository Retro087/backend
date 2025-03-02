const { Sequelize } = require("sequelize");
const PurchaseRequests = require("../models/PurchaseRequests");

exports.createPurchaseRequest = async (req, res) => {
  try {
    const { productId, quantity, comments, sellerId } = req.body;
    const userId = req.user.id; // Получаем ID пользователя из middleware аутентификации

    // Валидация данных
    if (!productId || !quantity || !sellerId) {
      return res
        .status(400)
        .json({ message: "productId и quantity обязательны для заполнения." });
    }

    if (sellerId == userId) {
      return res
        .status(400)
        .json({ message: "вы не можете сделать запрос себе." });
    }

    const existingRequest = await PurchaseRequests.findOne({
      where: {
        userId: userId,
        productId: productId,
        status: {
          [Sequelize.Op.ne]: "rejected", // Исключаем отклоненные запросы
        },
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        message:
          "У вас уже есть активный запрос на этот товар. Дождитесь его обработки или отмените его.",
      });
    }

    const newPurchaseRequest = await PurchaseRequests.create({
      userId: userId,
      productId: productId,
      sellerId: sellerId,
      quantity: quantity,
      comments: comments,
    });

    res.status(201).json({
      message: "Запрос на покупку успешно создан.",
      purchaseRequest: newPurchaseRequest,
    });
  } catch (error) {
    console.error("Ошибка при создании запроса на покупку:", error);
    res.status(500).json({
      message: "Ошибка при создании запроса на покупку.",
      error: error.message,
    });
  }
};

exports.deletePurchaseRequest = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Находим запрос на покупку по ID
    const purchaseRequest = await PurchaseRequests.findOne({
      where: { id },
    });

    // 2. Проверяем, существует ли запрос на покупку
    if (!purchaseRequest) {
      return res.status(404).json({ message: "Запрос на покупку не найден." });
    }

    // 3. Проверяем, является ли текущий пользователь отправителем запроса
    if (purchaseRequest.userId !== userId) {
      return res
        .status(403)
        .json({ message: "У вас нет прав на удаление этого запроса." }); // 403 Forbidden
    }

    // 4. Удаляем запрос на покупку
    const deletedPurchaseRequest = await PurchaseRequests.destroy({
      where: { id },
    });

    if (!deletedPurchaseRequest) {
      //  Эта проверка, скорее всего, никогда не будет выполнена, так как мы уже проверили существование запроса.
      return res
        .status(500)
        .json({ message: "Ошибка при удалении запроса на покупку." });
    }

    res.json({ message: "Запрос на покупку успешно удален." });
  } catch (error) {
    console.error("Ошибка при удалении запроса на покупку:", error);
    res.status(500).json({
      message: "Ошибка при удалении запроса на покупку.",
      error: error.message,
    });
  }
};

exports.updatePurchaseRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  console.log(id, status, userId);
  try {
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Недопустимый статус запроса." });
    }

    const updatedPurchaseRequest = await PurchaseRequests.update(
      { status, approvalDate: status === "approved" ? new Date() : null }, //Обновляем статус и дату одобрения
      { where: { id } }
    );

    if (!updatedPurchaseRequest[0]) {
      return res.status(404).json({ message: "Запрос на покупку не найден." });
    }

    const purchaseRequest = await PurchaseRequests.findByPk(id);

    if (purchaseRequest.sellerId !== userId) {
      return res
        .status(403)
        .json({ message: "У вас нет прав на удаление этого запроса." }); // 403 Forbidden
    }

    res.json(purchaseRequest);
  } catch (error) {
    console.error("Ошибка при обновлении статуса запроса на покупку:", error);
    res.status(500).json({
      message: "Ошибка при обновлении статуса запроса на покупку.",
      error: error.message,
    });
  }
};

exports.getAllPurchaseRequests = async (req, res) => {
  try {
    const userId = req.user.id; // Получаем ID пользователя из middleware аутентификации

    // Находим продукты, которые принадлежат этому продавцу

    // Получаем запросы на покупку только для продуктов этого продавца
    const purchaseRequests = await PurchaseRequests.findAll({
      where: {
        [Sequelize.Op.or]: [
          { userId: userId }, // Запросы, созданные этим пользователем (покупателем)
          { sellerId: userId }, // Запросы, относящиеся к продуктам этого продавца
        ],
      },
    });

    res.json(purchaseRequests);
  } catch (error) {
    console.error("Ошибка при получении списка запросов на покупку:", error);
    res.status(500).json({
      message: "Ошибка при получении списка запросов на покупку.",
      error: error.message,
    });
  }
};
