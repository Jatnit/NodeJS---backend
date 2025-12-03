import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const ProductSKU = sequelize.define(
  "ProductSKU",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ProductId",
    },
    skuCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "SkuCode",
    },
    colorValueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ColorValueId",
    },
    sizeValueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "SizeValueId",
    },
    price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "Price",
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "StockQuantity",
    },
  },
  {
    tableName: "ProductSKUs",
    timestamps: false,
  }
);

export default ProductSKU;
