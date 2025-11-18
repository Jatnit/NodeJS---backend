import express from "express";
import configViewEngine from "./configs/viewEngine";
import initWebRoutes from "./routes/web";
import bodyParser from "body-parser";
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

//config body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//config view engine
configViewEngine(app);
//init web routes
initWebRoutes(app);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
