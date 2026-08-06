const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Dish = require("../models/Dish");

// @desc    Get all restaurants for Super Admin
// @route   GET /api/admin/restaurants
// @access  Private (Super Admin)
const getAllRestaurantsAdmin = async (req, res) => {
    try {
        const restaurants = await Restaurant.find().select("-password").sort({ createdAt: -1 });
        res.json({ success: true, count: restaurants.length, restaurants });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch restaurants" });
    }
};

// @desc    Approve Restaurant
// @route   PATCH /api/admin/restaurants/:id/approve
// @access  Private (Super Admin)
const approveRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        restaurant.status = "Approved";
        await restaurant.save();

        res.json({ success: true, message: `Restaurant ${restaurant.restaurantName} approved`, restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to approve restaurant" });
    }
};

// @desc    Reject Restaurant
// @route   PATCH /api/admin/restaurants/:id/reject
// @access  Private (Super Admin)
const rejectRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        restaurant.status = "Rejected";
        await restaurant.save();

        res.json({ success: true, message: `Restaurant ${restaurant.restaurantName} rejected`, restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to reject restaurant" });
    }
};

// @desc    Delete Restaurant
// @route   DELETE /api/admin/restaurants/:id
// @access  Private (Super Admin)
const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        await Restaurant.findByIdAndDelete(req.params.id);
        // Clean up dishes owned by this restaurant
        await Dish.deleteMany({ restaurant: req.params.id });

        res.json({ success: true, message: "Restaurant and associated dishes deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete restaurant" });
    }
};

// @desc    Get all customers for Super Admin
// @route   GET /api/admin/customers
// @access  Private (Super Admin)
const getAllCustomersAdmin = async (req, res) => {
    try {
        const customers = await User.find({ role: "customer" }).select("-password").sort({ createdAt: -1 });
        res.json({ success: true, count: customers.length, customers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch customers" });
    }
};

// @desc    Delete Customer
// @route   DELETE /api/admin/customers/:id
// @access  Private (Super Admin)
const deleteCustomerAdmin = async (req, res) => {
    try {
        const customer = await User.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Customer account deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete customer" });
    }
};

// @desc    Get Platform Analytics
// @route   GET /api/admin/analytics
// @access  Private (Super Admin)
const getPlatformAnalytics = async (req, res) => {
    try {
        const totalRestaurants = await Restaurant.countDocuments();
        const approvedRestaurants = await Restaurant.countDocuments({ status: "Approved" });
        const pendingRestaurants = await Restaurant.countDocuments({ status: "Pending" });
        const totalCustomers = await User.countDocuments({ role: "customer" });
        const totalBookings = await Booking.countDocuments();
        const totalDishes = await Dish.countDocuments();

        const allBookings = await Booking.find();
        const totalRevenue = allBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        res.json({
            success: true,
            analytics: {
                totalRestaurants,
                approvedRestaurants,
                pendingRestaurants,
                totalCustomers,
                totalBookings,
                totalDishes,
                totalRevenue,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch platform analytics" });
    }
};

module.exports = {
    getAllRestaurantsAdmin,
    approveRestaurant,
    rejectRestaurant,
    deleteRestaurant,
    getAllCustomersAdmin,
    deleteCustomerAdmin,
    getPlatformAnalytics,
};
