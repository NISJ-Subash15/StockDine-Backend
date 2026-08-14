const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

// Protect routes for authenticated users/restaurants/staff
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "stockdine_super_secret_key");

            // 1. Check if token belongs to Restaurant
            const restaurant = await Restaurant.findById(decoded.id).select("-password");
            if (restaurant) {
                req.restaurant = restaurant;
                req.user = { _id: restaurant._id, id: restaurant._id, role: "RESTAURANT_ADMIN", name: restaurant.restaurantName };
                return next();
            }

            // 2. Check if token belongs to User (Customer / Super Admin)
            const user = await User.findById(decoded.id).select("-password");
            if (user) {
                req.user = user;
                const userRole = (user.role || "").toUpperCase();
                if (userRole === "SUPERADMIN" || userRole === "SUPER_ADMIN" || user.email === "subash@gmail.com" || user.email === "nisjsubash@gmail.com") {
                    req.user.role = "SUPER_ADMIN";
                } else if (!req.user.role || req.user.role.toLowerCase() === "customer") {
                    req.user.role = "USER";
                }
                return next();
            }

            // 3. Check if token belongs to Staff (Kitchen Staff / Member)
            try {
                const Staff = require("../models/Staff");
                const staff = await Staff.findById(decoded.id).select("-password").populate("restaurant");
                if (staff) {
                    req.staff = staff;
                    const staffRole = staff.role === "Manager" ? "RESTAURANT_ADMIN" : "RESTAURANT_MEMBER";
                    req.user = {
                        _id: staff._id,
                        id: staff._id,
                        role: staffRole,
                        name: staff.name,
                        restaurantId: staff.restaurant?._id || staff.restaurant,
                    };
                    return next();
                }
            } catch (sErr) {
                // Ignore staff lookup error if model not loaded
            }

            return res.status(401).json({ success: false, message: "Authentication required" });
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }
};

// Role authorization middleware factory
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const userRole = (req.restaurant ? "RESTAURANT_ADMIN" : req.user?.role || "").toUpperCase();
        const allowedRoles = roles.map(r => r.toUpperCase());
        if (!userRole || (!allowedRoles.includes(userRole) && !allowedRoles.includes("ALL"))) {
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
    const role = (req.user?.role || (req.restaurant ? "RESTAURANT_ADMIN" : "")).toUpperCase();
    if (req.restaurant || role === "RESTAURANT_ADMIN" || role === "RESTAURANT" || role === "SUPER_ADMIN" || role === "SUPERADMIN") {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Restaurant Admin only." });
    }
};

// Ensure authenticated request is Super Admin
const superAdminOnly = (req, res, next) => {
    const role = (req.user?.role || "").toUpperCase();
    if (role === "SUPER_ADMIN" || role === "SUPERADMIN" || role === "SUPER_ADMINISTRATOR" || req.user?.email === "subash@gmail.com" || req.user?.email === "nisjsubash@gmail.com") {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Super Admin privileges required." });
    }
};

module.exports = { protect, authorizeRoles, restaurantOnly, superAdminOnly };
