const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RefreshTokens = sequelize.define("RefreshTokens", {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

module.exports = RefreshTokens;
