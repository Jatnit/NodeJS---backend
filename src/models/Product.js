import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "Name",
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: "Slug",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Description",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "CategoryId",
    },
    basePrice: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "BasePrice",
    },
    thumbnailUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "ThumbnailUrl",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "IsActive",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "CreatedAt",
      allowNull: true,
    },
  },
  {
    tableName: "Products",
    timestamps: false,
  }
);

export default Product;

