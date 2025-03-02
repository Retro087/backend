const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Messages = require("./Messages");
const Chats = sequelize.define(
  "Chats",
  {
    user1: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user2: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lastMessage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  { timestamps: true }
);

module.exports = Chats;
