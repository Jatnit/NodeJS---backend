import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "Name",
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      field: "Slug",
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "ParentId",
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "ImageUrl",
    },
  },
  {
    tableName: "Categories",
    timestamps: false,
  }
);

export default Category;
