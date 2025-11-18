import express from "express";
import homeController from "../controller/homeController";
const router = express.Router();

/**
 * @param {*} app  - express app
 */

const initWebRoutes = (app) => {
  router.get("/", homeController.handleHelloWorld);
  router.get("/user", homeController.handleUserPage);
  router.get("/signin", homeController.renderSignIn);
  router.post("/signin", homeController.handleSignIn);
  router.get("/signup", homeController.renderSignUp);
  router.post("/user/create-user", homeController.handleCreateUser);
  router.post("/user/delete-user/:id", homeController.handleDeleteUser);
  router.post("/user/edit-user", homeController.handleEditUser);

  return app.use("/", router);
};

export default initWebRoutes;
