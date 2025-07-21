const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Expenses = sequelize.define("Expenses", {
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});
module.exports = Expenses;
