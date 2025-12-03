import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const ProductGallery = sequelize.define(
  "ProductGallery",
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
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "ImageUrl",
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "DisplayOrder",
    },
  },
  {
    tableName: "ProductGalleries",
    timestamps: false,
  }
);

export default ProductGallery;


