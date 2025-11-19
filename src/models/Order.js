import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "UserId",
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "OrderDate",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "TotalAmount",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "Status",
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "PaymentMethod",
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "IsPaid",
    },
    shippingName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "ShippingName",
    },
    shippingPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "ShippingPhone",
    },
    shippingAddress: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "ShippingAddress",
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Note",
    },
  },
  {
    tableName: "Orders",
    timestamps: false,
  }
);

export default Order;
