import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const ReviewImage = sequelize.define(
  "ReviewImage",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ReviewId",
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "ImageUrl",
    },
  },
  {
    tableName: "ReviewImages",
    timestamps: false,
  }
);

export default ReviewImage;


