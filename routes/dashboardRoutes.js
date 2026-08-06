const express = require("express");
const router = express.Router();
const { getRestaurantDashboard } = require("../controllers/dashboardController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");

// Restaurant Admin Dashboard Analytics
router.get("/restaurant", protect, restaurantOnly, getRestaurantDashboard);

module.exports = router;
