import express from "express";
import homeController from "../controller/homeController";
import adminCategoryController from "../controller/adminCategoryController";
import adminProductController from "../controller/adminProductController";
import upload from "../middleware/upload";
const router = express.Router();

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
  router.get("/user/orders/:orderId", homeController.renderOrderDetailPage);
  router.post(
    "/user/orders/:orderId/cancel",
    homeController.handleOrderCancellation
  );

  // admin categories
  router.get("/admin/categories", adminCategoryController.listCategories);
  router.get(
    "/admin/categories/:id/edit",
    adminCategoryController.renderEditCategory
  );
  router.post(
    "/admin/categories",
    upload.single("image"),
    adminCategoryController.createCategory
  );
  router.post(
    "/admin/categories/:id",
    upload.single("image"),
    adminCategoryController.updateCategory
  );
  router.post(
    "/admin/categories/:id/delete",
    adminCategoryController.deleteCategory
  );

  // admin products
  router.get("/admin/products", adminProductController.listProducts);
  router.get(
    "/admin/products/:id/edit",
    adminProductController.renderEditProduct
  );
  router.post(
    "/admin/products",
    upload.single("thumbnail"),
    adminProductController.createProduct
  );
  router.post(
    "/admin/products/:id",
    upload.single("thumbnail"),
    adminProductController.updateProduct
  );
  router.post(
    "/admin/products/:id/delete",
    adminProductController.deleteProduct
  );

  router.get("/user/profile/:id", homeController.handleUserProfile);

  return app.use("/", router);
};

export default initWebRoutes;
