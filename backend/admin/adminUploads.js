const express = require("express");
const multer = require("multer");
const { verifyAdmin } = require("./adminAuth");
const rateLimit = require("../middleware/rateLimit");
const { saveImage, ALLOWED_IMAGE_TYPES } = require("../services/storage");

const router = express.Router();

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

// Files are held in memory (max 3 MB) so the real type can be checked before anything touches the disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 5 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
    const error = new Error("Only JPEG, PNG or WebP images can be uploaded");
    error.status = 415;
    return cb(error);
  },
});

function readSingleImage(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "Image must be 3 MB or smaller" });
      }
      return res.status(400).json({ success: false, message: 'Send one image in the "image" field' });
    }
    if (err.status === 415) {
      return res.status(415).json({ success: false, message: err.message });
    }
    return next(err);
  });
}

/**
 * POST /api/admin/uploads
 * multipart/form-data with one file in "image" (JPEG, PNG or WebP, max 3 MB).
 * Responds { success: true, url: "/uploads/products/<uuid>.<ext>" }.
 */
router.post(
  "/",
  verifyAdmin,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 120, name: "admin-uploads", message: "Too many uploads. Please wait a few minutes." }),
  readSingleImage,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Send one image in the "image" field' });
    }
    try {
      const { url } = await saveImage(req.file.buffer, { folder: "products" });
      return res.status(201).json({ success: true, url });
    } catch (error) {
      if (error.status === 415) {
        return res.status(415).json({ success: false, message: error.message });
      }
      console.error("Image upload error:", error);
      return res.status(500).json({ success: false, message: "Could not store the image" });
    }
  }
);

module.exports = router;
