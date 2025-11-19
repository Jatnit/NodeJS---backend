import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const UserAddress = sequelize.define(
  "UserAddress",
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
    recipientName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "RecipientName",
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "PhoneNumber",
    },
    addressLine: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "AddressLine",
    },
    ward: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Ward",
    },
    district: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "District",
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "City",
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "IsDefault",
    },
  },
  {
    tableName: "UserAddresses",
    timestamps: false,
  }
);

export default UserAddress;
