const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Users = sequelize.define(
  "Users",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    google_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },
    yandex_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
    },
    card: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
  },
  { timestamps: true }
);

module.exports = Users;
