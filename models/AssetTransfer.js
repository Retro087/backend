const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AssetTransfer = sequelize.define("AssetTransfer", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  domainTransferStatus: {
    type: DataTypes.ENUM("pending", "completed", "failed"),
    defaultValue: "pending",
  },
  websiteTransferStatus: {
    type: DataTypes.ENUM("pending", "completed", "failed"),
    defaultValue: "pending",
  },
  socialMediaTransferStatus: {
    type: DataTypes.ENUM("pending", "completed", "failed"),
    defaultValue: "pending",
  },
  buyerConfirmation: {
    type: DataTypes.ENUM("pending", "confirmed", "rejected"),
    defaultValue: "pending",
  },
  // You'll need to adapt the code based on how card details will be used (encrypted or via a token):
  card_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = AssetTransfer;
