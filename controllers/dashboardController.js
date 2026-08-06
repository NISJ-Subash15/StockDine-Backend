const Booking = require("../models/Booking");
const Dish = require("../models/Dish");
const Table = require("../models/Table");
const Review = require("../models/Review");

// @desc    Get Restaurant Dashboard Statistics
// @route   GET /api/dashboard/restaurant
// @access  Private (Restaurant Admin)
const getRestaurantDashboard = async (req, res) => {
    try {
        const restaurantId = req.restaurant?._id || req.user?._id || req.query.restaurantId;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: "Restaurant ID is required" });
        }

        // Get start & end of today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Today's Bookings & Orders
        const todayBookings = await Booking.find({
            restaurant: restaurantId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        });

        const todaysOrdersCount = todayBookings.length;
        const todaysBookingsCount = todayBookings.filter((b) => b.tableNumber && b.tableNumber !== "TBD").length;
        const todaysRevenue = todayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Table Stats
        const availableTablesCount = await Table.countDocuments({
            restaurant: restaurantId,
            isAvailable: true,
        });

        const occupiedTablesCount = await Table.countDocuments({
            restaurant: restaurantId,
            isAvailable: false,
        });

        // Popular Dishes (Lowest portions left or most ordered)
        const popularDishes = await Dish.find({ restaurant: restaurantId }).sort({ portionsLeft: 1 }).limit(5);

        // Low Stock Dishes (portions <= 5)
        const lowStockDishes = await Dish.find({
            restaurant: restaurantId,
            portionsLeft: { $lte: 5 },
        });

        // Recent Reviews
        const recentReviews = await Review.find({ restaurant: restaurantId }).sort({ createdAt: -1 }).limit(5);

        res.json({
            success: true,
            dashboard: {
                todaysRevenue,
                todaysOrders: todaysOrdersCount,
                todaysBookings: todaysBookingsCount,
                availableTables: availableTablesCount,
                occupiedTables: occupiedTablesCount,
            },
            popularDishes: popularDishes || [],
            lowStockDishes: lowStockDishes || [],
            recentReviews: recentReviews || [],
        });
    } catch (error) {
        console.error("Restaurant Dashboard Error:", error);
        res.status(500).json({ success: false, message: "Failed to load dashboard statistics" });
    }
};

module.exports = {
    getRestaurantDashboard,
};
