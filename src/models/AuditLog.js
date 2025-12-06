import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "Id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "UserId",
    },
    actionType: {
      type: DataTypes.ENUM(
        "LOGIN",
        "LOGOUT",
        "CREATE",
        "UPDATE",
        "DELETE",
        "VIEW",
        "EXPORT"
      ),
      allowNull: false,
      field: "ActionType",
    },
    entityTable: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "EntityTable",
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "EntityId",
    },
    oldValues: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "OldValues",
    },
    newValues: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "NewValues",
    },
    changedFields: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "ChangedFields",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "IpAddress",
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "UserAgent",
    },
    requestMethod: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: "RequestMethod",
    },
    requestUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "RequestUrl",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Description",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "Metadata",
    },
    createdAt: {
      type: DataTypes.DATE(3),
      field: "CreatedAt",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "AuditLogs",
    timestamps: false,
  }
);

export default AuditLog;
