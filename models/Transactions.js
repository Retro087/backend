const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Transactions = sequelize.define("Transactions", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  purchaseRequestId: {
    // Foreign Key to PurchaseRequest
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  buyerId: {
    // Foreign Key to User
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sellerId: {
    // Foreign Key to User
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  businessId: {
    // Foreign Key to Business
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("completed", "refunded", "disputed"),
    defaultValue: "completed",
  },
});

module.exports = Transactions;
