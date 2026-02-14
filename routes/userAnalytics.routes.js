import express from "express";
import {
 
  getUserHistoryByEmail,
  getMatchedResults,
  blockUser,
  unblockUser,
  logDownload,
  getDownloadStats,
  getImageDeliveryStats,
  getUserRequests
} from "../controllers/userAnalytics.controller.js";

import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/requests", verifyAdmin, getUserRequests);
router.get("/history/:email", verifyAdmin, getUserHistoryByEmail);
router.get("/matches/:requestId", verifyAdmin, getMatchedResults);

router.post("/block-user", verifyAdmin, blockUser);
router.post("/unblock-user", verifyAdmin, unblockUser);

router.post("/log-download", logDownload);
router.get("/download-stats", verifyAdmin, getDownloadStats);

router.get("/delivery-stats", verifyAdmin, getImageDeliveryStats);

export default router;
