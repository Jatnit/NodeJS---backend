import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const AttributeValue = sequelize.define(
  "AttributeValue",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    attributeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "AttributeId",
    },
    value: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "Value",
    },
  },
  {
    tableName: "AttributeValues",
    timestamps: false,
  }
);

export default AttributeValue;

