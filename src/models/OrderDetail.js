import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const OrderDetail = sequelize.define(
  "OrderDetail",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "OrderId",
    },
    productSkuId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "ProductSkuId",
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "ProductName",
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Color",
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Size",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "Quantity",
    },
    unitPrice: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "UnitPrice",
    },
    totalPrice: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "TotalPrice",
    },
  },
  {
    tableName: "OrderDetails",
    timestamps: false,
  }
);

export default OrderDetail;

