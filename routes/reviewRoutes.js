const express = require("express");
const router = express.Router();
const { createReview, getRestaurantReviews, replyToReview } = require("../controllers/reviewController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");

// Customer rate and review
router.post("/", createReview);

// Get reviews for a restaurant
router.get("/restaurant/:restaurantId", getRestaurantReviews);

// Restaurant owner reply to review
router.patch("/:id/reply", protect, restaurantOnly, replyToReview);

module.exports = router;
