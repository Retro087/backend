const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const UserSubscription = sequelize.define("User Subscription", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  subscriptionType: {
    type: DataTypes.INTEGER, // Ссылка на ID подписки
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("active", "expired", "cancelled"),
    defaultValue: "active",
  },
  startDate: {
    // начало оформление подписки
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  endDate: {
    //конец подписки
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = UserSubscription;
