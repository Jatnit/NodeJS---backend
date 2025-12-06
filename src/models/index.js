import Role from "./Role";
import User from "./User";
import UserAddress from "./UserAddress";
import Category from "./Category";
import Product from "./Product";
import Attribute from "./Attribute";
import AttributeValue from "./AttributeValue";
import ProductSKU from "./ProductSKU";
import Order from "./Order";
import OrderDetail from "./OrderDetail";
import Review from "./Review";
import ProductCategory from "./ProductCategory";
import ProductGallery from "./ProductGallery";
import ProductColorImage from "./ProductColorImage";
import ReviewImage from "./ReviewImage";
import AuditLog from "./AuditLog";

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

Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: "productId",
  otherKey: "categoryId",
});
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: "categoryId",
  otherKey: "productId",
});

Product.hasMany(ProductSKU, { foreignKey: "productId" });
ProductSKU.belongsTo(Product, { foreignKey: "productId" });

Product.hasMany(ProductGallery, { foreignKey: "productId" });
ProductGallery.belongsTo(Product, { foreignKey: "productId" });

Product.hasMany(ProductColorImage, { foreignKey: "productId" });
ProductColorImage.belongsTo(Product, { foreignKey: "productId" });
ProductColorImage.belongsTo(AttributeValue, {
  foreignKey: "colorValueId",
  as: "colorValue",
});

Attribute.hasMany(AttributeValue, { foreignKey: "attributeId" });
AttributeValue.belongsTo(Attribute, { foreignKey: "attributeId" });

ProductSKU.belongsTo(AttributeValue, {
  foreignKey: "colorValueId",
  as: "colorValue",
});
ProductSKU.belongsTo(AttributeValue, {
  foreignKey: "sizeValueId",
  as: "sizeValue",
});
AttributeValue.hasMany(ProductSKU, {
  foreignKey: "colorValueId",
  as: "colorVariants",
});
AttributeValue.hasMany(ProductSKU, {
  foreignKey: "sizeValueId",
  as: "sizeVariants",
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
Review.hasMany(ReviewImage, { foreignKey: "reviewId" });
ReviewImage.belongsTo(Review, { foreignKey: "reviewId" });

// Audit Logs
User.hasMany(AuditLog, { foreignKey: "userId" });
AuditLog.belongsTo(User, { foreignKey: "userId" });

export {
  Role,
  User,
  UserAddress,
  Category,
  Product,
  Attribute,
  AttributeValue,
  ProductSKU,
  ProductCategory,
  Order,
  OrderDetail,
  Review,
  ProductGallery,
  ProductColorImage,
  ReviewImage,
  AuditLog,
};
