import { DataTypes } from "sequelize";
import sequelize from "../configs/database";

const SKUAttributeValue = sequelize.define(
  "SKUAttributeValue",
  {
    productSkuId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "ProductSkuId",
    },
    attributeValueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "AttributeValueId",
    },
  },
  {
    tableName: "SKU_AttributeValues",
    timestamps: false,
  }
);

export default SKUAttributeValue;
