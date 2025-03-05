const { DataTypes } = require("sequelize");
const generateUUID = require("../utils/generateUUID");
const { sequelize } = require("../config/db");

const Payments = sequelize.define("Payment", {
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      "pending",

      "succeeded",
      "canceled"
    ),
    defaultValue: "pending",
  },
  yookassaPaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  purchaseRequestId: {
    // Foreign Key to PurchaseRequest
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Payments;
/**/
