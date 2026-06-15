import { Router } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Store file in memory (buffer) before uploading to Cloudinary
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

// ─── POST /api/upload/image ────────────────────────────────────
// Auth required: upload a single image to Cloudinary
router.post(
  "/image",
  uploadLimiter,
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      // Upload buffer to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder:         "second_sync/listings",
            transformation: [{ width: 1200, quality: "auto", fetch_format: "auto" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      res.json({
        url:       result.secure_url,
        public_id: result.public_id,
        width:     result.width,
        height:    result.height,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /api/upload/images ───────────────────────────────────
// Auth required: upload multiple images (max 5)
router.post(
  "/images",
  uploadLimiter,
  requireAuth,
  upload.array("files", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded." });
      }

      const uploads = await Promise.all(
        req.files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder:         "second_sync/listings",
                  transformation: [{ width: 1200, quality: "auto", fetch_format: "auto" }],
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result.secure_url);
                }
              );
              stream.end(file.buffer);
            })
        )
      );

      res.json({ urls: uploads });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── DELETE /api/upload/image ──────────────────────────────────
// Auth required: delete image from Cloudinary
router.delete("/image", requireAuth, async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ error: "public_id is required." });
    }
    await cloudinary.uploader.destroy(public_id);
    res.json({ message: "Image deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
