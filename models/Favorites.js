const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Products = require("./Products");

const Favorites = sequelize.define(
  "Favorites",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: true }
);

Favorites.belongsTo(Products, {
  foreignKey: "itemId",
  targetKey: "id",
  as: "Product",
});

module.exports = Favorites;
