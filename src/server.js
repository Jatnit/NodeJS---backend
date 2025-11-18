import express from "express";
import configViewEngine from "./configs/viewEngine";
import initWebRoutes from "./routes/web";
import bodyParser from "body-parser";
import session from "express-session";
import sequelize from "./configs/database";
import "./models/User";
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
  next();
});

//config view engine
configViewEngine(app);
//init web routes
initWebRoutes(app);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
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
