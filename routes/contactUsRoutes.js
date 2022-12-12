import express from "express";
import { contactUs } from "../controllers/contactUsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", protect, contactUs);

export default router;
