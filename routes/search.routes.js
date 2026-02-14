import express from "express";
import { searchBySelfieandEmail } from "../controllers/SearchVerEmail.js";
import { upload } from "../middlewares/multer.middleware.js";
import { checkEmailVerified, sendEmailOTP, verifyEmailOTP } from "../controllers/email.controller.js";

const router = express.Router();

router.post(
  "/events/:eventId/selfiesing",
  upload.single("selfie"),
  searchBySelfieandEmail
);

router.post("/send-otp", sendEmailOTP);
router.post("/verify-otp", verifyEmailOTP);
router.post("/verify-Email", checkEmailVerified);


export default router;
