const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Categories = sequelize.define("Categories", {
  Category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Categories;
