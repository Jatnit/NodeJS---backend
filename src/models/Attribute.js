import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const Attribute = sequelize.define(
  "Attribute",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "Name",
    },
  },
  {
    tableName: "Attributes",
    timestamps: false,
  }
);

export default Attribute;

