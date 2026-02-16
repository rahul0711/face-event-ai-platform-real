import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { checkDBConnection } from "./database/db.js";

import adminRoutes from "./routes/admin.routes.js";
import eventRoutes from "./routes/event.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import SearchEmail from "./routes/search.routes.js";
import UserHistory from "./routes/userAnalytics.routes.js";

// ✅ Load env FIRST
dotenv.config({ path: "./.env" });

const app = express();

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://demo.scriptindia.in:8021",
  "https://eventphotos.scriptindia.in"
];

// ✅ Proper CORS Setup
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or Postman (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

// ✅ Body parsers (ONLY ONCE)
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// ✅ Static files
app.use(express.static("public"));

// ✅ Connect DB
checkDBConnection();

// ✅ Routes
app.use("/api/admin", adminRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/email", SearchEmail);
app.use("/api/history", UserHistory);

// ✅ Health check route (optional but useful)
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// ✅ Start server
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
