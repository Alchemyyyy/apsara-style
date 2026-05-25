const { ok } = require("../../shared/responses");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { v2: cloudinary } = require("cloudinary");
const { serverUrl } = require("../../config/app.config");
const { cloudinary: cloudinaryConfig, isCloudinaryConfigured, uploadStorage } = require("../../config/uploads.config");
const adminAuditRepo = require("../adminAudit/repository");

const uploadRoot = path.resolve(__dirname, "../../../uploads/products");
fs.mkdirSync(uploadRoot, { recursive: true });

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
const storageDriver = uploadStorage;
const cloudinaryFolder = cloudinaryConfig.folder;
const usingCloudinary = storageDriver === "cloudinary";

if (usingCloudinary) {
  cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    secure: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && ext.length <= 8 ? ext : ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!allowedMime.has(String(file.mimetype || "").toLowerCase())) {
      const err = new Error("Only JPG, PNG, and WEBP images are allowed");
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

function ensureCloudinaryConfigured() {
  if (!usingCloudinary) return;
  if (!isCloudinaryConfigured()) {
    const err = new Error("Cloudinary storage is selected but not fully configured");
    err.status = 500;
    throw err;
  }
}

async function optimizeImageToWebp(sourcePath, webpName) {
  const optimizedPath = path.resolve(uploadRoot, webpName);
  await sharp(sourcePath)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(optimizedPath);
  return optimizedPath;
}

async function uploadOptimizedToCloudinary(optimizedPath, webpName) {
  ensureCloudinaryConfigured();
  const publicId = path.parse(webpName).name;
  return cloudinary.uploader.upload(optimizedPath, {
    resource_type: "image",
    folder: cloudinaryFolder,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
  });
}

const uploadImages = (req, res, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const friendly =
          err.code === "LIMIT_FILE_SIZE"
            ? "Each image must be <= 5MB"
            : err.code === "LIMIT_FILE_COUNT"
              ? "You can upload up to 10 images at once"
              : "Invalid upload payload";
        const mapped = new Error(friendly);
        mapped.status = 400;
        return next(mapped);
      }
      return next(err);
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      const e = new Error("No image files provided");
      e.status = 400;
      return next(e);
    }

    const origin = serverUrl.replace(/\/+$/, "");

    const work = async () => {
      const data = [];
      for (const f of files) {
        const sourcePath = path.resolve(uploadRoot, f.filename);
        const webpName = `${path.parse(f.filename).name}.webp`;
        const optimizedPath = await optimizeImageToWebp(sourcePath, webpName);
        await fsp.unlink(sourcePath).catch(() => {});

        if (usingCloudinary) {
          const uploaded = await uploadOptimizedToCloudinary(optimizedPath, webpName);
          await fsp.unlink(optimizedPath).catch(() => {});
          data.push({
            url: uploaded.secure_url,
            filename: uploaded.public_id,
            size: Number(uploaded.bytes || 0),
            mime: "image/webp",
            provider: "cloudinary",
          });
        } else {
          const stats = await fsp.stat(optimizedPath);
          data.push({
            url: `${origin}/uploads/products/${webpName}`,
            filename: webpName,
            size: stats.size,
            mime: "image/webp",
            provider: "local",
          });
        }
      }
      return data;
    };

    work()
      .then(async (data) => {
        try {
          await adminAuditRepo.insertAuditLog({
            actorAdminId: req.admin?.id || null,
            action: "upload.images",
            entityType: "upload",
            entityId: null,
            meta: { count: data.length, provider: usingCloudinary ? "cloudinary" : "local" },
          });
        } catch {
          // ignore audit failures
        }
        ok(res, data);
      })
      .catch(async (optErr) => {
        for (const f of files) {
          const sourcePath = path.resolve(uploadRoot, f.filename);
          const webpName = `${path.parse(f.filename).name}.webp`;
          const optimizedPath = path.resolve(uploadRoot, webpName);
          await fsp.unlink(sourcePath).catch(() => {});
          await fsp.unlink(optimizedPath).catch(() => {});
        }
        next(optErr);
      });
  });
};

module.exports = {
  uploadImages,
};
