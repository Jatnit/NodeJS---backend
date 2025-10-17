import express from "express";
import configViewEngine  from "./configs/viewEngine";
import initWebRoutes from "./routes/web";

const app = express();
//config view engine
configViewEngine(app)
//init web routes
initWebRoutes(app)


const PORT = 8080
app.listen(PORT, () =>{
    // Sửa lại thành 'PORT'
    console.log(`Example app listening on port ${PORT}`); 
})