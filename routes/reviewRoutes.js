const express = require("express");
const router = express.Router();
const { createReview, getRestaurantReviews, getFeaturedReviews, replyToReview } = require("../controllers/reviewController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");

// Public featured reviews for landing page
router.get("/featured", getFeaturedReviews);

// Customer rate and review (Requires Authentication & Completed Booking)
router.post("/", protect, createReview);

// Get reviews for a restaurant
router.get("/restaurant/:restaurantId", getRestaurantReviews);

// Restaurant owner reply to review
router.patch("/:id/reply", protect, restaurantOnly, replyToReview);

module.exports = router;
