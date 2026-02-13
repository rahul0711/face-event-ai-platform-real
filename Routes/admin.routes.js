import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  logoutAdmin
} from "../controllers/admin.controller.js";

import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();



router.post("/register", upload.single("image"), registerAdmin);

router.post("/login", loginAdmin);

router.get("/getProfile", verifyAdmin, getAdminProfile);

router.put(
  "/updateProfile",
  verifyAdmin,
  upload.single("image"),
  updateAdminProfile
);


router.post("/logout", logoutAdmin);

export default router;
