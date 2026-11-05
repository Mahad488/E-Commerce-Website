/**
 * Image storage. Pick a driver with STORAGE_DRIVER (default "local").
 *
 * A driver is an object with `save({ buffer, ext, folder }) -> Promise<url>`.
 * To add Cloudinary or S3 later, write a driver that uploads the buffer and
 * returns its public https URL, then register it in `drivers` below.
 */
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");

// Only these formats are accepted. The real type is read from the file's first
// bytes, so a renamed .exe or an SVG with a fake Content-Type is rejected.
const IMAGE_SIGNATURES = [
  { mime: "image/jpeg", ext: "jpg", matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    ext: "png",
    matches: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/webp",
    ext: "webp",
    matches: (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  },
];

const ALLOWED_IMAGE_TYPES = IMAGE_SIGNATURES.map((s) => s.mime);

/** Returns { mime, ext } for a JPEG, PNG or WebP buffer, otherwise null. */
function detectImageType(buffer) {
  const match = IMAGE_SIGNATURES.find((s) => s.matches(buffer));
  return match ? { mime: match.mime, ext: match.ext } : null;
}

const localDriver = {
  async save({ buffer, ext, folder }) {
    const dir = path.join(UPLOADS_ROOT, folder);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${crypto.randomUUID()}.${ext}`;
    await fs.writeFile(path.join(dir, filename), buffer, { flag: "wx" });
    return `/uploads/${folder}/${filename}`;
  },
};

const cloudinaryDriver = {
  async save({ buffer, ext, folder }) {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials missing: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required.");
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `nova/${folder}`,
          resource_type: "image",
          format: ext,
        },
        (error, result) => {
          if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  },
};

const drivers = { local: localDriver, cloudinary: cloudinaryDriver };

function getDriver() {
  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  const defaultDriver = hasCloudinary ? "cloudinary" : "local";
  const name = (process.env.STORAGE_DRIVER || defaultDriver).trim().toLowerCase();
  const driver = drivers[name];
  if (!driver) {
    throw new Error(`Unknown STORAGE_DRIVER "${name}". Supported: ${Object.keys(drivers).join(", ")}`);
  }
  return driver;
}

/**
 * Validates and stores an image buffer.
 * Resolves to { url } or rejects with an Error whose `status` is 415 for a bad file.
 */
async function saveImage(buffer, { folder = "products" } = {}) {
  const type = detectImageType(buffer);
  if (!type) {
    const error = new Error("Only JPEG, PNG or WebP images can be uploaded");
    error.status = 415;
    throw error;
  }
  const url = await getDriver().save({ buffer, ext: type.ext, folder });
  return { url };
}

module.exports = { saveImage, detectImageType, ALLOWED_IMAGE_TYPES, UPLOADS_ROOT };
