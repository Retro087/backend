const { Sequelize } = require("sequelize");
const PurchaseRequests = require("../models/PurchaseRequests");
const Products = require("../models/Products");
const Notifications = require("../models/Notifications");

//  Импортируем функцию, возвращающую экземпляр io

exports.createPurchaseRequest = async (req, res) => {
  try {
    const io = req.io;
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
  const io = req.io;
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
    const io = req.io;
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
    const io = req.io;
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
      io.to(purchaseRequest.buyerId).emit("new_notification", notification); //  Отправляем уведомление только buyerId
      console.log(
        `Отправлено уведомление пользователю ${purchaseRequest.buyerId}`
      );
    } else {
      console.warn(
        "Не удалось отправить уведомление: io, io.to или buyerId отсутствуют."
      );
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
    const { type } = req.query; // Получаем тип запроса из query parameters (например, ?type=incoming или ?type=outgoing)

    let whereClause = {
      [Sequelize.Op.or]: [
        { buyerId: userId }, // Запросы, созданные этим пользователем (покупателем)
        { sellerId: userId }, // Запросы, относящиеся к продуктам этого продавца
      ],
    };

    // Фильтруем запросы в зависимости от типа
    if (type === "incoming") {
      whereClause = { sellerId: userId }; // Только входящие запросы (для этого продавца)
    } else if (type === "outgoing") {
      whereClause = { buyerId: userId }; // Только исходящие запросы (от этого покупателя)
    }

    const purchaseRequests = await PurchaseRequests.findAll({
      where: whereClause,
      // Можно добавить include для модели Products, User (покупателя, продавца)
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
exports.getPurchaseRequest = async (req, res) => {
  try {
    const userId = req.user.id; // Получаем ID пользователя из middleware аутентификации
    const { productId } = req.params;

    // Проверяем, существует ли продукт с заданным productId, чтобы избежать ошибок
    const product = await Products.findByPk(productId); //  Предполагается, что у вас есть модель Products
    if (!product) {
      return res.status(404).json({ message: "Продукт не найден" });
    }

    // Получаем запросы на покупку, используя оператор AND для сужения поиска
    const purchaseRequests = await PurchaseRequests.findOne({
      where: {
        [Sequelize.Op.and]: [
          { businessId: productId }, //  Фильтруем по productId
          {
            [Sequelize.Op.or]: [
              { buyerId: userId }, // Запросы, созданные этим пользователем (покупателем)
              // Запросы, относящиеся к продуктам этого продавца (продавец)
            ],
          },
        ],
      },
    });

    res.json(purchaseRequests);
  } catch (error) {
    console.error("Ошибка при получении запроса на покупку:", error);
    res.status(500).json({
      message: "Ошибка при получении запроса на покупку.",
      error: error.message,
    });
  }
};
