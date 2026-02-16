import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { checkDBConnection } from "./database/db.js";

import adminRoutes from "./routes/admin.routes.js";
import eventRoutes from "./routes/event.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import SearchEmail from "./routes/search.routes.js";
import UserHistory from "./routes/userAnalytics.routes.js";

// ✅ Load environment variables FIRST
dotenv.config({ path: "./.env" });

const app = express();

// ✅ CORS (IMPORTANT - do not overcomplicate this)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});


// ✅ Explicitly handle preflight
app.options("*", cors());

// ✅ Body parsers (ONLY ONCE)
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// ✅ Static folder
app.use(express.static("public"));

// ✅ Database connection
checkDBConnection();

// ✅ Routes
app.use("/api/admin", adminRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/email", SearchEmail);
app.use("/api/history", UserHistory);

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// ✅ Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
