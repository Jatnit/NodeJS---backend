import express from "express";
import productApiController from "../controller/productApiController";

const router = express.Router();

const initApiRoutes = (app) => {
  router.get("/products", productApiController.getProducts);
  router.get("/products/:id", productApiController.getProductDetail);
  return app.use("/api", router);
};

export default initApiRoutes;

