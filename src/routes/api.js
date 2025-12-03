import express from "express";
import productApiController from "../controller/productApiController";
import DashboardController from "../controller/DashboardController";
import orderController from "../controller/orderController";
import inventoryController from "../controller/inventoryController";
import {
  verifyToken,
  authorize,
  attachUserIfAvailable,
} from "../middleware/authMiddleware";

const router = express.Router();

const initApiRoutes = (app) => {
  router.get("/products", productApiController.getProducts);
  router.get("/products/:id", productApiController.getProductDetail);
  router.get(
    "/products/:id/stock-matrix",
    productApiController.getStockMatrix
  );
  router.put(
    "/products/:id/stock-matrix",
    productApiController.updateStockMatrix
  );
  router.post("/orders", attachUserIfAvailable, orderController.checkout);
  router.get(
    "/orders",
    verifyToken,
    authorize("admin", "manager"),
    orderController.listOrders
  );
  router.get(
    "/orders/:id",
    verifyToken,
    authorize("admin", "manager"),
    orderController.getOrderDetail
  );
  router.put(
    "/orders/:id/status",
    verifyToken,
    authorize("admin", "manager"),
    orderController.updateOrderStatus
  );
  router.get(
    "/inventory",
    verifyToken,
    authorize("admin", "manager"),
    inventoryController.listInventory
  );
  router.get(
    "/inventory/best-sellers",
    verifyToken,
    authorize("admin", "manager"),
    inventoryController.getBestSellers
  );
  router.get("/dashboard/summary", DashboardController.getSummary);
  router.get("/orders/recent", DashboardController.getRecentOrders);
  return app.use("/api", router);
};

export default initApiRoutes;
