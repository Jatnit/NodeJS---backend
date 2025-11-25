import express from "express";
import productApiController from "../controller/productApiController";
import DashboardController from "../controller/DashboardController";

const router = express.Router();

const initApiRoutes = (app) => {
  router.get("/products", productApiController.getProducts);
  router.get("/products/:id", productApiController.getProductDetail);
  router.get("/dashboard/summary", DashboardController.getSummary);
  router.get("/orders/recent", DashboardController.getRecentOrders);
  return app.use("/api", router);
};

export default initApiRoutes;
