import express from "express";
import configViewEngine from "./configs/viewEngine";
import initWebRoutes from "./routes/web";
import initApiRoutes from "./routes/api";
import bodyParser from "body-parser";
import session from "express-session";
import sequelize from "./configs/database";
import { Role } from "./models";
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

//config body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//config session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "moda_studio_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);

//share locals
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.theme = req.session.theme || "light";
  const cart = req.session.cart || { items: [], subtotal: 0 };
  res.locals.cartItems = cart.items;
  res.locals.cartSubtotal = cart.subtotal;
  next();
});

//config view engine
configViewEngine(app);
//init api routes
initApiRoutes(app);
//init web routes
initWebRoutes(app);

const ensureDefaultRoles = async () => {
  const defaultRoles = [
    { roleName: "Admin", description: "System administrator" },
    { roleName: "Customer", description: "Default customer account" },
    { roleName: "Staff", description: "Store staff account" },
  ];

  for (const role of defaultRoles) {
    await Role.findOrCreate({
      where: { roleName: role.roleName },
      defaults: role,
    });
  }
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureDefaultRoles();
    console.log("Database connection established.");
    app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}`);
    });
  } catch (error) {
    console.log("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
