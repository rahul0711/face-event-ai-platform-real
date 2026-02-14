import express from "express";
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from "cookie-parser";
import { checkDBConnection } from "./database/db.js";

const app = express()

app.use(express.json({limit: "500mb"}))
app.use(express.urlencoded({extended: true, limit: "500mb"}))
app.use(express.static("public"))
app.use(cookieParser()) 


checkDBConnection()
app.use(
  cors({
    origin: ["http://localhost:5173",
  "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json())
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "*");
    next();
});
dotenv.config({
  path: './.env'
});


import adminRoutes from "./routes/admin.routes.js";
import eventRoutes from "./routes/event.routes.js";

// import searchRoutes from "./routes/search.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import SearchEmail from "./routes/search.routes.js"
// import googleupload from "./Routes/googleupload.routes.js"
import UserHistory from  "./routes/userAnalytics.routes.js"


app.use("/api/admin", adminRoutes);
app.use("/api/event", eventRoutes);

// app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/email", SearchEmail);
app.use("/api/history", UserHistory);

// app.use("/api/google", googleupload);


app.use(express.json({ type: "*/*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(process.env.PORT,"0.0.0.0",(req,res)=>{
    console.log(`welcome this line is working in http://localhost:${process.env.PORT}`)
});