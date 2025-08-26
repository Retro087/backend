const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AssetForSale = sequelize.define(
  "AssetForSale",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    businessId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    selectedItems: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    isUniqueContent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isUniqueDesign: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    support: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    tableName: "assetforsale",
    timestamps: false,
  }
);

module.exports = AssetForSale;
