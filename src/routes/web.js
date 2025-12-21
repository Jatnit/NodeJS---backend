import express from "express";
import homeController from "../controllers/client/homeController";
import categoryController from "../controllers/admin/categoryController";
import productController from "../controllers/admin/productController";
import upload from "../middleware/upload";
const router = express.Router();

const productUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "galleryImages", maxCount: 3 },
  { name: "colorImageFiles", maxCount: 20 },
]);

/**
 * @param {*} app  - express app
 */

const initWebRoutes = (app) => {
  router.get("/", homeController.handleHelloWorld);
  router.get("/signin", homeController.renderSignIn);
  router.post("/signin", homeController.handleSignIn);
  router.get("/signup", homeController.renderSignUp);
  router.post("/user/create-user", homeController.handleCreateUser);
  router.post("/logout", homeController.handleLogout);
  router.post("/user/theme", homeController.handleThemeChange);
  router.get("/products", homeController.handleProductListing);
  router.get("/products/:id", homeController.handleProductDetail);
  router.post("/cart/add", homeController.handleAddToCart);
  router.get("/checkout", homeController.renderCheckoutPage);
  router.post("/checkout", homeController.handleCheckout);

  router.get("/admin/users", homeController.handleUserPage);
  router.post("/admin/create-user", homeController.handleCreateUser);
  router.post("/admin/delete-user/:id", homeController.handleDeleteUser);
  router.post("/admin/edit-user", homeController.handleEditUser);
  router.get("/admin/dashboard", homeController.renderAdminDashboard);
  router.get("/admin/orders", homeController.renderAdminOrders);
  router.get("/admin/inventory", homeController.renderAdminInventory);
  router.get("/user/orders/:orderId", homeController.renderOrderDetailPage);
  router.post(
    "/user/orders/:orderId/cancel",
    homeController.handleOrderCancellation
  );

  // admin categories
  router.get("/admin/categories", categoryController.listCategories);
  router.get(
    "/admin/categories/:id/edit",
    categoryController.renderEditCategory
  );
  router.post(
    "/admin/categories",
    upload.single("image"),
    categoryController.createCategory
  );
  router.post(
    "/admin/categories/:id",
    upload.single("image"),
    categoryController.updateCategory
  );
  router.post(
    "/admin/categories/:id/delete",
    categoryController.deleteCategory
  );

  // admin products
  router.get("/admin/products", productController.listProducts);
  router.get("/admin/products/:id/edit", productController.renderEditProduct);
  router.post(
    "/admin/products",
    productUpload,
    productController.createProduct
  );
  router.post(
    "/admin/products/:id",
    productUpload,
    productController.updateProduct
  );
  router.post("/admin/products/:id/delete", productController.deleteProduct);

  // Audit Logs - Super Admin only
  router.get("/admin/audit-logs", homeController.renderAuditLogs);

  // User profile
  router.get("/user/profile/:id", homeController.handleUserProfile);

  // Address management API
  router.post("/user/addresses", homeController.handleAddAddress);
  router.post("/user/addresses/:id", homeController.handleUpdateAddress);
  router.post("/user/addresses/:id/delete", homeController.handleDeleteAddress);
  router.post("/user/addresses/:id/set-default", homeController.handleSetDefaultAddress);

  return app.use("/", router);
};

export default initWebRoutes;
