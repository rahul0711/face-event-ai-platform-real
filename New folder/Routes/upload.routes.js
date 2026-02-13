import express from "express";
import { deleteEventImage, getImagesCount, uploadEventImages } from "../controllers/upload.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

/* ADMIN UPLOAD EVENT IMAGES */
router.post(
  "/events/:eventId/images",
  verifyAdmin,
  upload.array("images"),
  uploadEventImages
);

router.delete(
  "/events/images/:imageId",
  verifyAdmin,
  deleteEventImage
);


router.get(
  "/events/images/count",
  verifyAdmin,
  getImagesCount
);

export default router;
