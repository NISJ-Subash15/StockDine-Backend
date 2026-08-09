const express = require("express");
const router = express.Router();
const {
    createBooking,
    getBookingById,
    getMyBookings,
    cancelBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

// Authenticated booking / hold table creation
router.post("/", protect, createBooking);

// Customer bookings
router.get("/my-bookings", protect, getMyBookings);

// Booking status by ID
router.get("/:id", getBookingById);

// Cancel booking
router.patch("/:id/cancel", cancelBooking);

module.exports = router;
