const Products = require("../models/Products");
const PurchaseRequests = require("../models/PurchaseRequests");
const Transactions = require("../models/Transactions");
const Transaction = require("../models/Transactions");

exports.getBuyerTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // ID покупателя из middleware аутентификации

    const transactions = await Transactions.findAll({
      where: { buyerId: userId },
      order: [["createdAt", "DESC"]],
    });

    // Fetch related data separately

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при получении истории покупок" });
  }
};

exports.getSellerTransactions = async (req, res) => {
  try {
    const userId = req.user.id; //  ID продавца из middleware аутентификации

    const transactions = await Transactions.findAll({
      where: { sellerId: userId },
      order: [["createdAt", "DESC"]],
    });
    // Fetch related data separately

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при получении истории продаж" });
  }
};
