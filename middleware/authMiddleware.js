const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

// Protect routes for authenticated users/restaurants
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "stockdine_super_secret_key");

            // Check if token belongs to Restaurant or User
            const restaurant = await Restaurant.findById(decoded.id).select("-password");
            if (restaurant) {
                req.restaurant = restaurant;
                req.user = { _id: restaurant._id, id: restaurant._id, role: "restaurant", name: restaurant.restaurantName };
                return next();
            }

            const user = await User.findById(decoded.id).select("-password");
            if (user) {
                req.user = user;
                return next();
            }

            return res.status(401).json({ success: false, message: "Not authorized, user/restaurant not found" });
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            return res.status(401).json({ success: false, message: "Not authorized, token invalid or expired" });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }
};

// Role authorization middleware factory
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const userRole = req.restaurant ? "restaurant" : req.user?.role;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${userRole}' is not authorized to access this resource.`,
            });
        }
        next();
    };
};

// Ensure authenticated request is a restaurant owner/admin
const restaurantOnly = (req, res, next) => {
    if (req.restaurant || (req.user && (req.user.role === "restaurant" || req.user.role === "superadmin"))) {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Restaurant Admin only." });
    }
};

// Ensure authenticated request is Super Admin
const superAdminOnly = (req, res, next) => {
    if (req.user && (req.user.role === "superadmin" || req.user.role === "admin")) {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Super Admin privileges required." });
    }
};

module.exports = { protect, authorizeRoles, restaurantOnly, superAdminOnly };
