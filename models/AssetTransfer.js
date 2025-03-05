const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AssetTransfer = sequelize.define("AssetTransfer", {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  transferDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isConfirmedByBuyer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isConfirmedBySeller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = AssetTransfer;
