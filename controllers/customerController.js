const User = require("../models/User");
const Booking = require("../models/Booking");
const Restaurant = require("../models/Restaurant");

// @desc    Get Customer Profile (with Favourites & Booking History)
// @route   GET /api/customers/profile
// @access  Private (Customer)
const getCustomerProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await User.findById(req.user._id).populate("favouriteRestaurants", "restaurantName restaurantLogo address cuisine rating");

        if (!user) {
            return res.status(404).json({ success: false, message: "Customer profile not found" });
        }

        const bookings = await Booking.find({ user: req.user._id })
            .populate("restaurant", "restaurantName restaurantLogo address")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            customer: {
                id: user._id,
                _id: user._id,
                customerId: user.customerId || `CUST-${user._id.toString().substring(0, 6)}`,
                name: user.name,
                mobile: user.mobile,
                email: user.email || "",
                role: user.role,
                createdAt: user.createdAt,
                memberSince: user.createdAt,
                lastLogin: user.lastLogin,
                favouriteRestaurants: user.favouriteRestaurants || [],
                bookingHistory: bookings || [],
            },
        });
    } catch (error) {
        console.error("Get Customer Profile Error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// @desc    Update Customer Profile
// @route   PUT /api/customers/profile
// @access  Private (Customer)
const updateCustomerProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { name, mobile, email } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        if (name) user.name = name;
        if (mobile) user.mobile = mobile;
        if (email) user.email = email;

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            customer: {
                id: user._id,
                _id: user._id,
                customerId: user.customerId,
                name: user.name,
                mobile: user.mobile,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
            },
        });
    } catch (error) {
        console.error("Update Customer Profile Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
    }
};

// @desc    Get Customer Booking History
// @route   GET /api/customers/bookings
// @access  Private (Customer)
const getCustomerBookings = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const bookings = await Booking.find({ user: req.user._id })
            .populate("restaurant", "restaurantName restaurantLogo address mobileNumber")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            bookings: bookings || [],
        });
    } catch (error) {
        console.error("Get Customer Bookings Error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// @desc    Toggle Favourite Restaurant
// @route   POST /api/customers/favourites/:restaurantId
// @access  Private (Customer)
const toggleFavouriteRestaurant = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { restaurantId } = req.params;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const index = user.favouriteRestaurants.indexOf(restaurantId);
        let isFavourite = false;

        if (index > -1) {
            user.favouriteRestaurants.splice(index, 1);
            isFavourite = false;
        } else {
            user.favouriteRestaurants.push(restaurantId);
            isFavourite = true;
        }

        await user.save();

        res.json({
            success: true,
            isFavourite,
            message: isFavourite ? "Added to favourites" : "Removed from favourites",
            favourites: user.favouriteRestaurants,
        });
    } catch (error) {
        console.error("Toggle Favourite Error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// @desc    Get Customer Favourites
// @route   GET /api/customers/favourites
// @access  Private (Customer)
const getCustomerFavourites = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await User.findById(req.user._id).populate("favouriteRestaurants");

        res.json({
            success: true,
            favourites: user ? user.favouriteRestaurants || [] : [],
        });
    } catch (error) {
        console.error("Get Favourites Error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

module.exports = {
    getCustomerProfile,
    updateCustomerProfile,
    getCustomerBookings,
    toggleFavouriteRestaurant,
    getCustomerFavourites,
};
