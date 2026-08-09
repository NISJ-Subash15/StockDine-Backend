const Review = require("../models/Review");
const Restaurant = require("../models/Restaurant");

// @desc    Add Review (Rate Restaurant, Rate Dish, Write Review)
// @route   POST /api/reviews
// @access  Public / Private
const createReview = async (req, res) => {
    try {
        const { restaurantId, customerName, restaurantRating, foodRating, review } = req.body;

        if (!restaurantId || !customerName || !restaurantRating || !foodRating) {
            return res.status(400).json({ success: false, message: "Please provide restaurantId, customerName, restaurantRating, and foodRating" });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const newReview = await Review.create({
            restaurant: restaurantId,
            user: req.user ? req.user._id : null,
            customerName,
            restaurantRating: Number(restaurantRating),
            foodRating: Number(foodRating),
            review: review || "",
        });

        // Update overall rating and total review count for restaurant
        const reviews = await Review.find({ restaurant: restaurantId });
        const avgRating = reviews.reduce((sum, r) => sum + r.restaurantRating, 0) / reviews.length;

        restaurant.rating = parseFloat(avgRating.toFixed(1));
        restaurant.numReviews = reviews.length;
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Review added successfully",
            review: newReview,
            restaurantRating: restaurant.rating,
            numReviews: restaurant.numReviews,
        });
    } catch (error) {
        console.error("Create Review Error:", error);
        res.status(500).json({ success: false, message: "Failed to submit review" });
    }
};

// @desc    Get Reviews for a Restaurant
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
const getRestaurantReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ restaurant: req.params.restaurantId }).sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, reviews: reviews || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch reviews" });
    }
};

// @desc    Get Featured Customer Reviews for Landing Page
// @route   GET /api/reviews/featured
// @access  Public
const getFeaturedReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("restaurant", "restaurantName city rating restaurantLogo")
            .populate("user", "name avatar")
            .sort({ restaurantRating: -1, createdAt: -1 })
            .limit(6);

        res.json({ success: true, count: reviews.length, reviews: reviews || [] });
    } catch (error) {
        console.error("Get Featured Reviews Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch featured reviews" });
    }
};

// @desc    Reply to a Review (Restaurant Owner)
// @route   PATCH /api/reviews/:id/reply
// @access  Private (Restaurant Admin)
const replyToReview = async (req, res) => {
    try {
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({ success: false, message: "Reply text is required" });
        }

        const reviewItem = await Review.findById(req.params.id);
        if (!reviewItem) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        reviewItem.reply = reply;
        await reviewItem.save();

        res.json({
            success: true,
            message: "Reply saved successfully",
            review: reviewItem,
        });
    } catch (error) {
        console.error("Reply to Review Error:", error);
        res.status(500).json({ success: false, message: "Failed to post reply to review" });
    }
};

module.exports = {
    createReview,
    getRestaurantReviews,
    getFeaturedReviews,
    replyToReview,
};
