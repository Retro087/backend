const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Users = require("./Users");
const Products = require("./Products");

const ProductStats = sequelize.define(
  "ProductStats",
  {
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    favorites_count: {
      type: DataTypes.INTEGER,
    },
    views_count: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "product_stats",
    timestamps: false,
  }
);

module.exports = ProductStats;
