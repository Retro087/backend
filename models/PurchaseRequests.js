const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const PurchaseRequests = sequelize.define("PurchaseRequests", {
  // Определение полей
  userId: {
    // Ссылка на пользователя, который сделал запрос
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  productId: {
    // Ссылка на продукт, который запрашивают
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Значение по умолчанию
    validate: {
      min: 1, // Минимальное значение - 1
    },
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"), // Возможные статусы
    allowNull: false,
    defaultValue: "pending", // Значение по умолчанию
  },
  requestDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Значение по умолчанию - текущая дата и время
  },
  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true, // Может быть NULL, пока запрос не одобрен
  },
  comments: {
    type: DataTypes.STRING,
    allowNull: true, // Можно добавить комментарий к запросу
  },
});

module.exports = PurchaseRequests;
