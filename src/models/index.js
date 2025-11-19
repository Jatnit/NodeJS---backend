import Role from "./Role";
import User from "./User";
import UserAddress from "./UserAddress";
import Category from "./Category";
import Product from "./Product";
import Attribute from "./Attribute";
import AttributeValue from "./AttributeValue";
import ProductSKU from "./ProductSKU";
import SKUAttributeValue from "./SKUAttributeValue";
import Order from "./Order";
import OrderDetail from "./OrderDetail";
import Review from "./Review";

Role.hasMany(User, { foreignKey: "roleId" });
User.belongsTo(Role, { foreignKey: "roleId" });

User.hasMany(UserAddress, { foreignKey: "userId" });
UserAddress.belongsTo(User, { foreignKey: "userId" });

Category.hasMany(Category, {
  as: "children",
  foreignKey: "parentId",
});
Category.belongsTo(Category, {
  as: "parent",
  foreignKey: "parentId",
});

Category.hasMany(Product, { foreignKey: "categoryId" });
Product.belongsTo(Category, { foreignKey: "categoryId" });

Product.hasMany(ProductSKU, { foreignKey: "productId" });
ProductSKU.belongsTo(Product, { foreignKey: "productId" });

Attribute.hasMany(AttributeValue, { foreignKey: "attributeId" });
AttributeValue.belongsTo(Attribute, { foreignKey: "attributeId" });

ProductSKU.belongsToMany(AttributeValue, {
  through: SKUAttributeValue,
  foreignKey: "productSkuId",
  otherKey: "attributeValueId",
});
AttributeValue.belongsToMany(ProductSKU, {
  through: SKUAttributeValue,
  foreignKey: "attributeValueId",
  otherKey: "productSkuId",
});

User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

Order.hasMany(OrderDetail, { foreignKey: "orderId" });
OrderDetail.belongsTo(Order, { foreignKey: "orderId" });

ProductSKU.hasMany(OrderDetail, { foreignKey: "productSkuId" });
OrderDetail.belongsTo(ProductSKU, { foreignKey: "productSkuId" });

User.hasMany(Review, { foreignKey: "userId" });
Review.belongsTo(User, { foreignKey: "userId" });

Product.hasMany(Review, { foreignKey: "productId" });
Review.belongsTo(Product, { foreignKey: "productId" });

export {
  Role,
  User,
  UserAddress,
  Category,
  Product,
  Attribute,
  AttributeValue,
  ProductSKU,
  SKUAttributeValue,
  Order,
  OrderDetail,
  Review,
};

