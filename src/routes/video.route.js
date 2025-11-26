import express from "express";
import {
  getAllVideos,
  getUploadUrl,
  getUserVideos,
  getVideoStatus,
  saveVideo,
  updateVideoStatus,
} from "../controller/video.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/all", getAllVideos);
router.post("/webhook/status", updateVideoStatus);

// Protected routes
router.post("/upload-url", authMiddleware, getUploadUrl);
router.post("/save", authMiddleware, saveVideo);
router.get("/my-videos", authMiddleware, getUserVideos);

// Video status check (requires auth)
router.get("/status/:videoId", authMiddleware, getVideoStatus);

export default router;
