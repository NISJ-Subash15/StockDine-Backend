const express = require("express");
const router = express.Router();
const {
    addDish,
    getDishes,
    getDishById,
    editDish,
    deleteDish,
    uploadDishImage,
    updatePortions,
    updatePrice,
    updateDescription,
    toggleStatus,
} = require("../controllers/dishController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

// Public Dish Search & Listing
router.get("/", getDishes);
router.get("/:id", getDishById);

// Protected Admin Routes
router.post("/", protect, restaurantOnly, upload.single("dishImage"), addDish);
router.put("/:id", protect, restaurantOnly, upload.single("dishImage"), editDish);
router.delete("/:id", protect, restaurantOnly, deleteDish);

router.post("/:id/upload-image", protect, restaurantOnly, upload.single("dishImage"), uploadDishImage);
router.patch("/:id/portions", protect, restaurantOnly, updatePortions);
router.patch("/:id/price", protect, restaurantOnly, updatePrice);
router.patch("/:id/description", protect, restaurantOnly, updateDescription);
router.patch("/:id/status", protect, restaurantOnly, toggleStatus);

module.exports = router;
