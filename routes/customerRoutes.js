const express = require("express");
const router = express.Router();
const {
    getCustomerProfile,
    updateCustomerProfile,
    getCustomerBookings,
    toggleFavouriteRestaurant,
    getCustomerFavourites,
} = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");

// Customer Profile
router.get("/profile", protect, getCustomerProfile);
router.put("/profile", protect, updateCustomerProfile);

// Customer Booking History
router.get("/bookings", protect, getCustomerBookings);

// Customer Favourite Restaurants
router.get("/favourites", protect, getCustomerFavourites);
router.post("/favourites/:restaurantId", protect, toggleFavouriteRestaurant);

module.exports = router;
