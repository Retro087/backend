const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Payouts = sequelize.define("Payouts", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "failed"),
    defaultValue: "pending",
  },
  yookassaPayoutId: {
    type: DataTypes.STRING, // ID from ЮKassa
    allowNull: true,
  },
});

module.exports = Payouts;
