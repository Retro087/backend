const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const SocialMedia = sequelize.define("SocialMedia", {
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  platforma: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});
module.exports = SocialMedia;
