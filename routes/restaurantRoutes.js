const express = require("express");
const router = express.Router();
const {
    getAllRestaurants,
    getRestaurantById,
    getRestaurantImages,
    getRestaurantProfile,
    updateRestaurantImages,
    updateRestaurantProfile,
    getDashboardStats,
    verifyAdminPassword,
    changeAdminPassword,
    getRestaurantGallery,
    addGalleryImage,
    deleteGalleryImage,
} = require("../controllers/restaurantController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");
const { upload, uploadGallery } = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", getAllRestaurants);

// Admin Dashboard stats & Profile (Must be before /:id route)
router.get("/dashboard", protect, restaurantOnly, getDashboardStats);
router.get("/profile", protect, restaurantOnly, getRestaurantProfile);

// Admin Security Password routes
router.post("/verify-admin-password", protect, verifyAdminPassword);
router.put("/change-admin-password", protect, restaurantOnly, changeAdminPassword);

// Restaurant Gallery routes
router.post("/gallery", protect, uploadGallery.single("image"), addGalleryImage);
router.delete("/gallery/:imageId", protect, deleteGalleryImage);

// Update Restaurant Profile
router.put(
    "/profile",
    protect,
    restaurantOnly,
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    updateRestaurantProfile
);

// Restaurant Images upload
router.post(
    "/images",
    protect,
    restaurantOnly,
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    updateRestaurantImages
);

router.get("/:id/images", getRestaurantImages);
router.get("/:id/gallery", getRestaurantGallery);
router.get("/:id", getRestaurantById);

module.exports = router;
