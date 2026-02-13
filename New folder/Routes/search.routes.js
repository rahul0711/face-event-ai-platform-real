import express from "express";
import { searchBySelfie } from "../controllers/search.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post(
  "/events/:eventId/selfie",
  upload.single("selfie"),
  searchBySelfie
);


export default router;
