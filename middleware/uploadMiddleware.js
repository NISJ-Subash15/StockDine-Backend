const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

// File Filter for Images
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files (jpeg, jpg, png, webp, gif) are allowed!"));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter,
});

// Ensure uploads/gallery folder exists
const galleryDir = path.join(__dirname, "../uploads/gallery");
if (!fs.existsSync(galleryDir)) {
    fs.mkdirSync(galleryDir, { recursive: true });
}

// Gallery Storage Configuration
const galleryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, galleryDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "gallery-" + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    },
});

const uploadGallery = multer({
    storage: galleryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter,
});

// Helper function to upload image file to Cloudinary (with local fallback)
const uploadToCloudinary = async (filePath, folder = "stockdine") => {
    try {
        const hasCloudinary =
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET;

        if (!hasCloudinary) {
            // Local upload fallback: return relative static server path
            const filename = path.basename(filePath);
            return `/uploads/${filename}`;
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: "auto",
        });

        // Clean up temporary local file after Cloudinary upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        // Fallback to local upload path on Cloudinary failure
        const filename = path.basename(filePath);
        return `/uploads/${filename}`;
    }
};

// Ensure uploads/tables folder exists
const tableDir = path.join(__dirname, "../uploads/tables");
if (!fs.existsSync(tableDir)) {
    fs.mkdirSync(tableDir, { recursive: true });
}

// Table Storage Configuration
const tableStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tableDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "table-" + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    },
});

const uploadTable = multer({
    storage: tableStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter,
});

module.exports = { upload, uploadGallery, uploadTable, uploadToCloudinary };
