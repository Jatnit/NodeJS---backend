import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "UserId",
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ProductId",
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "OrderId",
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: "Rating",
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Comment",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "CreatedAt",
      allowNull: true,
    },
  },
  {
    tableName: "Reviews",
    timestamps: false,
  }
);

export default Review;

