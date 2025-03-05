const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Notifications = sequelize.define("Notifications", {
  userId: {
    // Foreign Key to User
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      "purchase_request",
      "acceptance",
      "rejection",
      "payment",
      "assets_transfer",
      "confirmation",
      "funds_received",
      "completion"
    ),
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Notifications;
/**/
