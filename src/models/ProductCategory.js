import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const ProductCategory = sequelize.define(
  "ProductCategory",
  {
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "ProductId",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "CategoryId",
    },
  },
  {
    tableName: "ProductCategories",
    timestamps: false,
  }
);

export default ProductCategory;

