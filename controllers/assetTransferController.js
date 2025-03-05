const AssetTransfer = require("../models/AssetTransfer");
const Notifications = require("../models/Notifications");
const Products = require("../models/Products");
const PurchaseRequests = require("../models/PurchaseRequests");
const Transaction = require("../models/Transactions");
const { io } = require("../server");

exports.createAssetTransfer = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { purchaseRequestId, description } = req.body;

    const purchaseRequest = await PurchaseRequests.findByPk(purchaseRequestId);
    if (!purchaseRequest) {
      return res.status(404).json({ message: "Запрос не найден" });
    }

    if (purchaseRequest.sellerId !== sellerId) {
      return res
        .status(403)
        .json({ message: "Вы не являетесь продавцом в этом запросе" });
    }

    if (purchaseRequest.status !== "paid") {
      return res
        .status(400)
        .json({ message: "Передача активов возможна только после оплаты" });
    }

    const assetTransfer = await AssetTransfer.create({
      purchaseRequestId: purchaseRequestId,
      description: description,
      transferDate: new Date(),
    });

    purchaseRequest.status = "assets_transferred";
    purchaseRequest.assetTransferId = assetTransfer.id;
    await purchaseRequest.save();

    const business = await Products.findByPk(purchaseRequest.businessId);

    const notification = await Notifications.create({
      userId: purchaseRequest.buyerId,
      message: `Продавец передал активы по бизнесу ${business.name}. Подтвердите получение.`,
      type: "assets_transfer",
      purchaseRequestId: purchaseRequest.id,
    });

    if (io && io.to) {
      io.to(purchaseRequest.buyerId).emit("new_notification", notification);
    }

    res.status(201).json({
      message: "Информация о передаче активов создана",
      assetTransferId: assetTransfer.id,
      id: purchaseRequest.id,
      status: purchaseRequest.status,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Ошибка при создании информации о передаче активов" });
  }
};

exports.confirmAssetTransferBuyer = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { id } = req.params; // ID AssetTransfer

    const assetTransfer = await AssetTransfer.findByPk(id);

    if (!assetTransfer) {
      return res
        .status(404)
        .json({ message: "Информация о передаче активов не найдена" });
    }

    const purchaseRequest = await PurchaseRequests.findByPk(
      assetTransfer.purchaseRequestId
    );

    if (!purchaseRequest) {
      return res.status(404).json({ message: "Запрос на покупку не найден" });
    }

    if (purchaseRequest.buyerId !== buyerId) {
      return res
        .status(403)
        .json({ message: "Вы не являетесь покупателем в этом запросе" });
    }

    if (assetTransfer.isConfirmedByBuyer) {
      return res
        .status(400)
        .json({ message: "Вы уже подтвердили получение активов" });
    }

    assetTransfer.isConfirmedByBuyer = true;
    await assetTransfer.save();

    purchaseRequest.status = "assets_confirmed";
    await purchaseRequest.save();

    const business = await Products.findByPk(purchaseRequest.businessId);

    const notification = await Notifications.create({
      userId: purchaseRequest.sellerId,
      message: `Покупатель подтвердил получение активов по бизнесу ${business.name}`,
      type: "confirmation",
      purchaseRequestId: purchaseRequest.id,
    });

    if (io && io.to) {
      io.to(purchaseRequest.sellerId).emit("new_notification", notification);
    }

    res.status(200).json({
      message: "Вы подтвердили получение активов",
      id: purchaseRequest.id,
      status: purchaseRequest.status,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Ошибка при подтверждении получения активов" });
  }
};

exports.confirmAssetTransferSeller = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params; // ID AssetTransfer

    const assetTransfer = await AssetTransfer.findByPk(id);

    if (!assetTransfer) {
      return res
        .status(404)
        .json({ message: "Информация о передаче активов не найдена" });
    }

    const purchaseRequest = await PurchaseRequests.findByPk(
      assetTransfer.purchaseRequestId
    );
    if (!purchaseRequest) {
      return res.status(404).json({ message: "Запрос не найден" });
    }
    if (purchaseRequest.sellerId !== sellerId) {
      return res
        .status(403)
        .json({ message: "Вы не являетесь продавцом в этом запросе" });
    }

    if (assetTransfer.isConfirmedBySeller) {
      return res
        .status(400)
        .json({ message: "Вы уже подтвердили получение средств" });
    }

    if (!assetTransfer.isConfirmedByBuyer) {
      return res
        .status(400)
        .json({ message: "Покупатель еще не подтвердил получение активов" });
    }

    assetTransfer.isConfirmedBySeller = true;
    await assetTransfer.save();

    purchaseRequest.status = "funds_received";
    await purchaseRequest.save();

    const business = await Products.findByPk(purchaseRequest.businessId);

    //  Создаем запись о сделке
    await Transaction.create({
      purchaseRequestId: assetTransfer.purchaseRequestId,
      buyerId: purchaseRequest.buyerId,
      sellerId: sellerId,
      businessId: purchaseRequest.businessId,
      amount: business.price,
      status: "completed",
    });

    const notificationBuyer = await Notifications.create({
      userId: purchaseRequest.buyerId,
      message: `Сделка по бизнесу ${business.name} успешно завершена!`,
      type: "completion",
      purchaseRequestId: purchaseRequest.id,
    });

    if (io && io.to) {
      io.to(purchaseRequest.buyerId).emit(
        "new_notification",
        notificationBuyer
      );
    }
    const notificationSeller = await Notifications.create({
      userId: sellerId,
      message: `Сделка по бизнесу ${business.name} успешно завершена!`,
      type: "completion",
      purchaseRequestId: purchaseRequest.id,
    });

    if (io && io.to) {
      io.to(sellerId).emit("new_notification", notificationSeller);
    }
    res.status(200).json({
      message: "Вы подтвердили получение средств и завершили сделку",
      id: purchaseRequest.id,
      status: purchaseRequest.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка при подтверждении получения средств и завершении сделки",
    });
  }
};
