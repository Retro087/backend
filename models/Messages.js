const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Chats = require("./Chats");

const Messages = sequelize.define(
  "Messages",
  {
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recieverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  { timestamps: true }
);

module.exports = Messages;
