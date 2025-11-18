import express from "express";
import homeController from "../controller/homeController";
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

  router.get("/admin/users", homeController.handleUserPage);
  router.post("/admin/create-user", homeController.handleCreateUser);
  router.post("/admin/delete-user/:id", homeController.handleDeleteUser);
  router.post("/admin/edit-user", homeController.handleEditUser);

  router.get("/user/profile/:id", homeController.handleUserProfile);

  return app.use("/", router);
};

export default initWebRoutes;
