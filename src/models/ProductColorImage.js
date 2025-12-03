import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const ProductColorImage = sequelize.define(
  "ProductColorImage",
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
    colorValueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ColorValueId",
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "ImageUrl",
    },
  },
  {
    tableName: "ProductColorImages",
    timestamps: false,
  }
);

export default ProductColorImage;


