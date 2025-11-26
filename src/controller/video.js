import axios from "axios";
import dotenv from "dotenv";
import Video from "../model/video.model.js";

dotenv.config();

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

// Get upload URL from Cloudflare
export const getUploadUrl = async (req, res) => {
  try {
    // Check if user has completed payment
    if (req.user.paymentStatus !== "completed") {
      return res.status(403).json({ error: "Please complete payment first" });
    }

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`,
      {
        maxDurationSeconds: 300,
        allowedOrigins: ["localhost:3000", "bagurumba.vercel.app", "www.bagurumba.org", "bagurumba.org"],
        meta: {
          userId: req.user._id.toString(),
          category: req.user.category,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      uploadUrl: response.data.result.uploadURL,
      videoId: response.data.result.uid,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get upload URL" });
  }
};

// Save video metadata after upload
export const saveVideo = async (req, res) => {
  try {
    const { videoId, title } = req.body;

    const video = await Video.create({
      userId: req.user._id,
      videoId,
      title: title || "Bagurumba Performance",
      category: req.user.category,
      status: "processing",
    });

    res.status(201).json({ video });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save video" });
  }
};

// Get user's videos
export const getUserVideos = async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ videos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// Get all videos (public - for home page)
export const getAllVideos = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category
      ? { category, status: "processing" }
      : { status: "processing" };

    const videos = await Video.find(filter)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(videos);

    res.json({ videos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// Update video status (webhook from Cloudflare)
export const updateVideoStatus = async (req, res) => {
  try {
    const { videoId, status } = req.body;

    await Video.findOneAndUpdate({ videoId }, { status });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update video status" });
  }
};
