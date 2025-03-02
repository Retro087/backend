const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Products = sequelize.define(
  "Products",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    short: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    profit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    margin: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subs: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    favorites_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    buyerConfirmation: {
      type: DataTypes.ENUM("pending", "confirmed", "rejected"),
      defaultValue: "pending",
    },
  
  },
  { timestamps: true }
);

module.exports = Products;
/**/
