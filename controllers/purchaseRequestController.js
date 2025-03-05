const { Sequelize } = require("sequelize");
const PurchaseRequests = require("../models/PurchaseRequests");
const Products = require("../models/Products");
const Notifications = require("../models/Notifications");
const { io } = require("../server");

exports.createPurchaseRequest = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { businessId, amount } = req.body;

    const business = await Products.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ message: "Бизнес не найден" });
    }

    if (business.user_id === buyerId) {
      return res
        .status(404)
        .json({ message: "Вы не можете сделать запрос себе" });
    }

    const sellerId = business.user_id;

    const newPurchaseRequest = await PurchaseRequests.create({
      buyerId: buyerId,
      businessId: businessId,
      amount: amount,
      sellerId: sellerId,
      status: "pending",
    });

    // Создаем уведомление для продавца
    const notification = await Notifications.create({
      userId: sellerId,
      message: `Пользователь ${req.user.username} хочет купить ваш бизнес ${business.name}`,
      type: "purchase_request",
      purchaseRequestId: newPurchaseRequest.id,
    });

    // Отправляем уведомление через WebSocket
    if (io && io.to) {
      io.to(sellerId).emit("new_notification", notification);
    }

    res.status(201).json({
      message: "Запрос отправлен",
      purchaseRequestId: newPurchaseRequest.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при отправке запроса" });
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

exports.acceptPurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const purchaseRequest = await PurchaseRequests.findByPk(id);

    if (!purchaseRequest) {
      return res.status(404).json({ message: "Запрос не найден" });
    }

    if (purchaseRequest.sellerId !== sellerId) {
      return res
        .status(403)
        .json({ message: "Вы не являетесь владельцем этого бизнеса" });
    }

    if (purchaseRequest.status !== "pending") {
      return res.status(400).json({ message: "Запрос уже обработан" });
    }

    purchaseRequest.status = "accepted";
    await purchaseRequest.save();

    // Загрузка данных о бизнесе
    const business = await Products.findByPk(purchaseRequest.businessId);

    // Создаем уведомление для покупателя
    const notification = await Notifications.create({
      userId: purchaseRequest.buyerId,
      message: `Ваш запрос на покупку бизнеса ${business.name} принят`,
      type: "acceptance",
      purchaseRequestId: purchaseRequest.id,
    });

    // Отправляем уведомление через WebSocket
    if (io && io.to) {
      io.to(purchaseRequest.buyerId).emit("new_notification", notification);
    }

    res.status(200).json({ message: "Запрос принят", id: purchaseRequest.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при принятии запроса" });
  }
};

exports.rejectPurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const purchaseRequest = await PurchaseRequests.findByPk(id);

    if (!purchaseRequest) {
      return res.status(404).json({ message: "Запрос не найден" });
    }

    if (purchaseRequest.sellerId !== sellerId) {
      return res
        .status(403)
        .json({ message: "Вы не являетесь владельцем этого бизнеса" });
    }

    if (purchaseRequest.status !== "pending") {
      return res.status(400).json({ message: "Запрос уже обработан" });
    }

    purchaseRequest.status = "rejected";
    await purchaseRequest.save();

    const business = await Products.findByPk(purchaseRequest.businessId);

    const notification = await Notifications.create({
      userId: purchaseRequest.buyerId,
      message: `Ваш запрос на покупку бизнеса ${business.name} отклонен`,
      type: "rejection",
      purchaseRequestId: purchaseRequest.id,
    });

    if (io && io.to) {
      io.to(purchaseRequest.buyerId).emit("new_notification", notification);
    }

    res
      .status(200)
      .json({ message: "Запрос отклонен", id: purchaseRequest.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при отклонении запроса" });
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
          { buyerId: userId }, // Запросы, созданные этим пользователем (покупателем)
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
