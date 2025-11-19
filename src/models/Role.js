import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    roleName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "RoleName",
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Description",
    },
  },
  {
    tableName: "Roles",
    timestamps: false,
  }
);

export default Role;

