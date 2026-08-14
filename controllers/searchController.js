const Dish = require("../models/Dish");
const Restaurant = require("../models/Restaurant");

// @desc    Unified intelligent search across dishes, restaurants, and cuisines
// @route   GET /api/search
// @access  Public
const searchAll = async (req, res) => {
    try {
        const queryStr = (req.query.q || req.query.query || req.query.search || "").toString().trim();

        if (!queryStr) {
            return res.json({
                success: true,
                results: {
                    dishes: [],
                    restaurants: [],
                    cuisines: [],
                },
            });
        }

        const regex = new RegExp(queryStr, "i");

        // 1. Search Dishes (Available dishes first)
        const rawDishes = await Dish.find({
            $or: [
                { dishName: regex },
                { description: regex },
                { category: regex },
            ],
        })
            .populate("restaurant", "restaurantName restaurantId address city rating cuisine restaurantCover restaurantLogo")
            .limit(15);

        const dishes = rawDishes.filter((d) => d.restaurant && d.restaurant._id && d.restaurant.restaurantName).slice(0, 10);

        // 2. Search Restaurants (Approved / Active only)
        const restaurants = await Restaurant.find({
            status: { $in: ["Approved", "Active", "active", "approved"] },
            $or: [
                { restaurantName: regex },
                { address: regex },
                { city: regex },
                { cuisine: regex },
            ],
        })
            .select("-password")
            .limit(10);

        // 3. Search Matching Cuisines
        const allCuisines = [
            "South Indian", "North Indian", "Chinese", "Italian",
            "Japanese", "Fast Food", "Healthy", "Desserts", "Biryani", "Continental"
        ];
        const matchingCuisines = allCuisines.filter(c => c.toLowerCase().includes(queryStr.toLowerCase()));

        res.json({
            success: true,
            results: {
                dishes: dishes || [],
                restaurants: restaurants || [],
                cuisines: matchingCuisines || [],
            },
        });
    } catch (error) {
        console.error("Unified Search Error:", error);
        res.status(500).json({ success: false, message: "Search failed" });
    }
};

module.exports = {
    searchAll,
};
