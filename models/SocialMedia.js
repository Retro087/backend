const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const SocialMedia = sequelize.define("SocialMedia", {
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  followers: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  platform: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});
module.exports = SocialMedia;
