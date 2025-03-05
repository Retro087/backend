const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const AssetTransfer = require("./AssetTransfer");

const PurchaseRequests = sequelize.define("PurchaseRequests", {
  // Определение полей
  buyerId: {
    // Foreign Key to User (buyer)
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  businessId: {
    // Foreign Key to Business
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assetTransferId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  sellerId: {
    // Foreign Key to User (seller)
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      "pending",
      "accepted",
      "rejected",
      "awaiting_payment",
      "paid",
      "assets_transferred",
      "assets_confirmed",
      "funds_received",
      "completed",
      "canceled"
    ),
    defaultValue: "pending",
  },
});

module.exports = PurchaseRequests;
