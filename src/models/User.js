import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "Username",
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "PasswordHash",
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      field: "Email",
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "FullName",
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "PhoneNumber",
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "AvatarUrl",
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      field: "RoleId",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "CreatedAt",
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "UpdatedAt",
      allowNull: true,
    },
  },
  {
    tableName: "Users",
    timestamps: false,
  }
);

export default User;
