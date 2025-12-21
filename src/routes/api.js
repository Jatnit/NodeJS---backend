import express from "express";
import productApiController from "../controllers/api/productController";
import dashboardController from "../controllers/admin/dashboardController";
import orderController from "../controllers/admin/orderController";
import inventoryController from "../controllers/admin/inventoryController";
import auditLogController from "../controllers/admin/auditLogController";
import {
  verifyToken,
  authorize,
  attachUserIfAvailable,
} from "../middleware/authMiddleware";

const router = express.Router();

const initApiRoutes = (app) => {
  router.get("/products", productApiController.getProducts);
  router.get(
    "/products/check-duplicate",
    productApiController.checkProductDuplicate
  );
  router.get("/products/:id", productApiController.getProductDetail);
  router.get("/products/:id/stock-matrix", productApiController.getStockMatrix);
  router.put(
    "/products/:id/stock-matrix",
    productApiController.updateStockMatrix
  );
  router.post(
    "/products/bulk-action",
    productApiController.bulkAction
  );
  router.post("/orders", attachUserIfAvailable, orderController.checkout);
  router.get(
    "/orders",
    verifyToken,
    authorize("admin", "manager"),
    orderController.listOrders
  );
  // IMPORTANT: /orders/recent phải đặt TRƯỚC /orders/:id để không bị match sai
  router.get("/orders/recent", dashboardController.getRecentOrders);
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
  router.get("/dashboard/summary", dashboardController.getSummary);

  // ============================================
  // AUDIT LOGS - Chỉ Super Admin (roleId = 0)
  // ============================================
  router.get(
    "/audit-logs/stats",
    verifyToken,
    auditLogController.getAuditStats
  );
  router.get(
    "/audit-logs/users",
    verifyToken,
    auditLogController.getActiveUsers
  );
  router.get(
    "/audit-logs/:id",
    verifyToken,
    auditLogController.getAuditLogDetail
  );
  router.get("/audit-logs", verifyToken, auditLogController.getAuditLogs);

  return app.use("/api", router);
};

export default initApiRoutes;
