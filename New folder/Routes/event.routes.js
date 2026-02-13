import express from "express";
import { createEvent, deleteEvent, getEvents, getEventsuser, getImagesByEvent, getImagesGroupedByEvent, updateEvent } from "../controllers/event.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", verifyAdmin, createEvent);
router.get("/events", verifyAdmin, getEvents);
router.get("/eventsuser", getEventsuser);
router.put("/update/:id", verifyAdmin, updateEvent);
router.delete("/delete/:id", verifyAdmin, deleteEvent);
router.get("/events/images", verifyAdmin, getImagesGroupedByEvent);
router.get("/events/:event_id/images", getImagesByEvent);



export default router;
