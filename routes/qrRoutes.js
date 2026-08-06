const express = require("express");
const router = express.Router();
const { generateRestaurantQR, scanCustomerQR } = require("../controllers/qrController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");

// Generate QR Code for restaurant
router.get("/restaurant/:restaurantId", generateRestaurantQR);

// Scan customer check-in QR code
router.post("/checkin", protect, restaurantOnly, scanCustomerQR);

module.exports = router;
