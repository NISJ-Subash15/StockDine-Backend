const express = require("express");
const router = express.Router();
const {
    addTable,
    getTables,
    editTable,
    deleteTable,
    toggleTableAvailability,
} = require("../controllers/tableController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");
const { uploadTable } = require("../middleware/uploadMiddleware");

const { createBooking } = require("../controllers/bookingController");

// Public / Protected table listing
router.get("/", getTables);
router.post("/hold", protect, createBooking);

// Admin table management
router.post("/", protect, restaurantOnly, uploadTable.single("image"), addTable);
router.put("/:id", protect, restaurantOnly, uploadTable.single("image"), editTable);
router.delete("/:id", protect, restaurantOnly, deleteTable);
router.patch("/:id/availability", protect, restaurantOnly, toggleTableAvailability);

module.exports = router;
