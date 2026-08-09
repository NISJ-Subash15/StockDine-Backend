const Restaurant = require("../models/Restaurant");
const Dish = require("../models/Dish");
const Booking = require("../models/Booking");
const Table = require("../models/Table");
const Review = require("../models/Review");
const { uploadToCloudinary } = require("../middleware/uploadMiddleware");

// @desc    Get all restaurants with search & filters (Nearby, Cuisine, Search text)
// @route   GET /api/restaurants
// @access  Public
const getAllRestaurants = async (req, res) => {
    try {
        const { search, cuisine, city, state, lat, lng } = req.query;

        let query = { status: { $in: ["Approved", "Active", "active", "approved"] } };

        if (search) {
            query.$or = [
                { restaurantName: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } },
                { city: { $regex: search, $options: "i" } },
                { cuisine: { $regex: search, $options: "i" } },
            ];
        }

        if (cuisine) {
            query.cuisine = { $regex: cuisine, $options: "i" };
        }

        if (city) {
            query.city = { $regex: city, $options: "i" };
        }

        if (state) {
            query.state = { $regex: state, $options: "i" };
        }

        const restaurants = await Restaurant.find(query).select("-password").sort({ rating: -1, createdAt: -1 });

        // Enforce strict deduplication by _id, email, restaurantId, or restaurantName
        const seenKeys = new Set();
        const uniqueRestaurants = [];

        for (const rest of restaurants) {
            const idKey = String(rest._id);
            const codeKey = rest.restaurantId ? String(rest.restaurantId).trim() : "";
            const emailKey = rest.email ? rest.email.toLowerCase().trim() : "";
            const nameKey = rest.restaurantName ? rest.restaurantName.toLowerCase().trim() : "";

            const isDuplicate =
                seenKeys.has(idKey) ||
                (codeKey && seenKeys.has(codeKey)) ||
                (emailKey && seenKeys.has(emailKey)) ||
                (nameKey && seenKeys.has(nameKey));

            if (!isDuplicate) {
                seenKeys.add(idKey);
                if (codeKey) seenKeys.add(codeKey);
                if (emailKey) seenKeys.add(emailKey);
                if (nameKey) seenKeys.add(nameKey);
                uniqueRestaurants.push(rest);
            }
        }

        // Populate live dish counts and available table counts for each restaurant
        const restaurantsWithCounts = await Promise.all(
            uniqueRestaurants.map(async (rest) => {
                const restObj = rest.toObject();
                const dishCount = await Dish.countDocuments({ restaurant: rest._id, available: true });
                const tableCount = await Table.countDocuments({ restaurant: rest._id, isBooked: false });
                return {
                    ...restObj,
                    availableDishes: dishCount,
                    availableTablesCount: tableCount,
                };
            })
        );

        res.json({ success: true, count: restaurantsWithCounts.length, restaurants: restaurantsWithCounts });
    } catch (error) {
        console.error("Get All Restaurants Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch restaurants" });
    }
};

const mongoose = require("mongoose");

// @desc    Get restaurant details by ID
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res) => {
    try {
        let restaurant;
        const targetId = req.params.id;

        if (mongoose.Types.ObjectId.isValid(targetId)) {
            restaurant = await Restaurant.findById(targetId).select("-password");
        }
        if (!restaurant) {
            restaurant = await Restaurant.findOne({ restaurantId: targetId }).select("-password");
        }

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const dishes = await Dish.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });
        const tables = await Table.find({ restaurant: restaurant._id });
        const reviews = await Review.find({ restaurant: restaurant._id }).sort({ createdAt: -1 }).limit(10);

        res.json({
            success: true,
            restaurant,
            dishes: dishes || [],
            tables: tables || [],
            reviews: reviews || [],
        });
    } catch (error) {
        console.error("Get Restaurant By ID Error:", error);
        res.status(500).json({ success: false, message: "Error fetching restaurant details" });
    }
};

// @desc    View Restaurant Images
// @route   GET /api/restaurants/:id/images
// @access  Public
const getRestaurantImages = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).select("restaurantLogo restaurantCover restaurantName");
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const dishes = await Dish.find({ restaurant: req.params.id }).select("dishName dishImage");
        const dishImages = dishes.map((d) => ({ name: d.dishName, url: d.dishImage }));

        res.json({
            success: true,
            logo: restaurant.restaurantLogo,
            cover: restaurant.restaurantCover,
            dishImages: dishImages || [],
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch restaurant images" });
    }
};

// @desc    Upload / Update Restaurant Images (Logo / Cover)
// @route   POST /api/restaurants/images
// @access  Private (Restaurant Admin)
const updateRestaurantImages = async (req, res) => {
    try {
        const restaurantId = req.restaurant?._id || req.user?._id;
        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        if (req.files) {
            if (req.files.logo && req.files.logo[0]) {
                restaurant.restaurantLogo = await uploadToCloudinary(req.files.logo[0].path, "stockdine/logos");
            }
            if (req.files.cover && req.files.cover[0]) {
                restaurant.restaurantCover = await uploadToCloudinary(req.files.cover[0].path, "stockdine/covers");
            }
            await restaurant.save();
        }

        res.json({
            success: true,
            message: "Restaurant images updated successfully",
            logo: restaurant.restaurantLogo,
            cover: restaurant.restaurantCover,
            restaurant,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to update images" });
    }
};

// @desc    Get Restaurant Profile Details
// @route   GET /api/restaurants/profile
// @access  Private (Restaurant Admin)
const getRestaurantProfile = async (req, res) => {
    try {
        const restaurantId = req.restaurant?._id || req.user?._id;
        const restaurant = await Restaurant.findById(restaurantId).select("-password");

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant profile not found" });
        }

        res.json({
            success: true,
            restaurant,
        });
    } catch (error) {
        console.error("Get Restaurant Profile Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch restaurant profile" });
    }
};

// @desc    Update Restaurant Profile Details
// @route   PUT /api/restaurants/profile
// @access  Private (Restaurant Admin)
const updateRestaurantProfile = async (req, res) => {
    try {
        const restaurantId = req.restaurant?._id || req.user?._id;
        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const {
            restaurantName,
            ownerName,
            mobileNumber,
            phone,
            address,
            city,
            state,
            country,
            pincode,
            cuisine,
            openingHours,
            closingHours,
            description,
            gstNumber,
            fssaiNumber,
            restaurantLogo,
            restaurantCover,
            adminPasswordProtection,
        } = req.body;

        if (restaurantName) restaurant.restaurantName = restaurantName;
        if (ownerName) restaurant.ownerName = ownerName;
        if (mobileNumber || phone) restaurant.mobileNumber = mobileNumber || phone;
        if (address) restaurant.address = address;
        if (city !== undefined) restaurant.city = city;
        if (state !== undefined) restaurant.state = state;
        if (country !== undefined) restaurant.country = country;
        if (pincode !== undefined) restaurant.pincode = pincode;
        if (cuisine) restaurant.cuisine = cuisine;
        if (openingHours !== undefined) restaurant.openingHours = openingHours;
        if (closingHours !== undefined) restaurant.closingHours = closingHours;
        if (description !== undefined) restaurant.description = description;
        if (gstNumber !== undefined) restaurant.gstNumber = gstNumber;
        if (fssaiNumber !== undefined) restaurant.fssaiNumber = fssaiNumber;
        if (restaurantLogo) restaurant.restaurantLogo = restaurantLogo;
        if (restaurantCover) restaurant.restaurantCover = restaurantCover;
        if (adminPasswordProtection !== undefined) {
            restaurant.adminPasswordProtection = adminPasswordProtection === true || adminPasswordProtection === "true";
        }

        // Handle uploaded logo & cover files if attached via multipart
        if (req.files) {
            if (req.files.logo && req.files.logo[0]) {
                restaurant.restaurantLogo = await uploadToCloudinary(req.files.logo[0].path, "stockdine/logos");
            }
            if (req.files.cover && req.files.cover[0]) {
                restaurant.restaurantCover = await uploadToCloudinary(req.files.cover[0].path, "stockdine/covers");
            }
        }

        await restaurant.save();

        res.json({
            success: true,
            message: "Restaurant profile updated successfully",
            restaurant,
        });
    } catch (error) {
        console.error("Update Restaurant Profile Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to update restaurant profile" });
    }
};

// @desc    Get Restaurant Dashboard Statistics
// @route   GET /api/restaurant/dashboard
// @access  Private (Restaurant Admin)
const getDashboardStats = async (req, res) => {
    try {
        const restaurantId = req.restaurant?._id || req.user?._id || req.query.restaurantId;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: "Restaurant ID required" });
        }

        // Get start & end of today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch Today's Bookings & Orders
        const todayBookings = await Booking.find({
            restaurant: restaurantId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        });

        const todaysOrders = todayBookings.length;
        const todaysBookings = todayBookings.filter((b) => b.tableNumber && b.tableNumber !== "TBD").length;
        const todaysRevenue = todayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Live Bookings (Confirmed, Preparing, Ready)
        const liveBookings = await Booking.find({
            restaurant: restaurantId,
            bookingStatus: { $in: ["Confirmed", "Preparing", "Ready"] },
        }).sort({ createdAt: -1 });

        // Available Tables & Occupied Tables
        const availableTables = await Table.countDocuments({
            restaurant: restaurantId,
            isAvailable: true,
        });

        const occupiedTables = await Table.countDocuments({
            restaurant: restaurantId,
            isAvailable: false,
        });

        // Popular Dishes (Most portions sold / lowest portions left)
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
            stats: {
                todaysRevenue,
                todaysOrders,
                todaysBookings,
                liveBookingsCount: liveBookings.length,
                availableTablesCount: availableTables,
                occupiedTablesCount: occupiedTables,
            },
            liveBookings: liveBookings || [],
            popularDishes: popularDishes || [],
            lowStockDishes: lowStockDishes || [],
            recentReviews: recentReviews || [],
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Error loading dashboard statistics" });
    }
};

// @desc    Verify Admin Security Password
// @route   POST /api/restaurants/verify-admin-password
// @access  Private (Authenticated User / Staff / Restaurant)
const verifyAdminPassword = async (req, res) => {
    try {
        const { adminPassword, restaurantId: inputRestId } = req.body;
        let targetId = req.restaurant?._id || req.user?._id || inputRestId;
        let restaurant;

        if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
            restaurant = await Restaurant.findById(targetId);
        }
        if (!restaurant && inputRestId) {
            restaurant = await Restaurant.findOne({ restaurantId: inputRestId });
        }
        if (!restaurant) {
            restaurant = await Restaurant.findOne({ status: "Approved" }) || await Restaurant.findOne();
        }

        if (!restaurant) {
            return res.status(404).json({ success: false, verified: false, message: "Restaurant account not found" });
        }

        if (restaurant.adminPasswordProtection === false) {
            return res.json({
                success: true,
                verified: true,
                protectionDisabled: true,
                message: "Admin Portal Password Protection is currently disabled",
            });
        }

        if (!adminPassword) {
            return res.status(400).json({ success: false, verified: false, message: "Admin Security Password is required" });
        }

        const isMatch = await restaurant.compareAdminPassword(adminPassword);
        if (isMatch) {
            return res.json({
                success: true,
                verified: true,
                message: "Admin Portal Security Password verified successfully",
            });
        } else {
            return res.status(401).json({
                success: false,
                verified: false,
                message: "Incorrect Admin Security Password. Please enter your valid password.",
            });
        }
    } catch (error) {
        console.error("Verify Admin Password Error:", error);
        res.status(500).json({ success: false, verified: false, message: error.message || "Failed to verify admin password" });
    }
};

// @desc    Change / Reset Admin Security Password
// @route   PUT /api/restaurants/change-admin-password
// @access  Private (Restaurant Admin)
const changeAdminPassword = async (req, res) => {
    try {
        const restaurantId = req.restaurant?._id || req.user?._id;
        const { currentPassword, newPassword } = req.body;

        if (!restaurantId) {
            return res.status(401).json({ success: false, message: "Unauthorized restaurant session" });
        }
        if (!newPassword || newPassword.trim().length < 6) {
            return res.status(400).json({ success: false, message: "New Admin Security Password must be at least 6 characters" });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant account not found" });
        }

        // Verify current password if restaurant already has an admin password set or currentPassword is provided
        if (restaurant.adminPassword || currentPassword) {
            const isMatch = await restaurant.compareAdminPassword(currentPassword || "");
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Current Admin Security Password is incorrect." });
            }
        }

        restaurant.adminPassword = newPassword.trim();
        await restaurant.save();

        console.log(`✅ Admin Security Password updated for restaurant: ${restaurant.restaurantName}`);

        res.json({
            success: true,
            message: "Admin Security Password updated and hashed in MongoDB successfully!",
        });
    } catch (error) {
        console.error("Change Admin Password Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to change admin password" });
    }
};

// @desc    Get Gallery Images for a Restaurant
// @route   GET /api/restaurants/:id/gallery
// @access  Public
const getRestaurantGallery = async (req, res) => {
    try {
        const targetId = req.params.id;
        let restaurant;

        if (mongoose.Types.ObjectId.isValid(targetId)) {
            restaurant = await Restaurant.findById(targetId).select("gallery");
        }
        if (!restaurant) {
            restaurant = await Restaurant.findOne({ restaurantId: targetId }).select("gallery");
        }

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        res.json({
            success: true,
            gallery: restaurant.gallery || [],
        });
    } catch (error) {
        console.error("Get Restaurant Gallery Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch gallery images" });
    }
};

// @desc    Upload & Add Gallery Image
// @route   POST /api/restaurants/gallery
// @access  Private (Restaurant Admin)
const addGalleryImage = async (req, res) => {
    try {
        const targetId = req.restaurant?._id || req.user?._id || req.body.restaurantId;
        let restaurant;

        if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
            restaurant = await Restaurant.findById(targetId);
        }
        if (!restaurant && req.body.restaurantId) {
            restaurant = await Restaurant.findOne({ restaurantId: req.body.restaurantId });
        }
        if (!restaurant) {
            restaurant = await Restaurant.findOne({ status: "Approved" }) || await Restaurant.findOne();
        }

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Please select an image file to upload" });
        }

        const relativePath = `/uploads/gallery/${req.file.filename}`;
        const category = req.body.category || "Interior";
        const title = req.body.title || "Restaurant Photo";

        const newImage = {
            url: relativePath,
            category,
            title,
            createdAt: new Date(),
        };

        restaurant.gallery.unshift(newImage);
        await restaurant.save();

        const addedItem = restaurant.gallery[0];

        console.log(`✅ Gallery image uploaded & saved to MongoDB for ${restaurant.restaurantName}: ${relativePath}`);

        res.status(201).json({
            success: true,
            message: "Gallery image uploaded successfully",
            image: {
                id: addedItem._id.toString(),
                _id: addedItem._id.toString(),
                url: addedItem.url,
                category: addedItem.category,
                title: addedItem.title,
                createdAt: addedItem.createdAt,
            },
        });
    } catch (error) {
        console.error("Add Gallery Image Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to upload gallery image" });
    }
};

// @desc    Delete Gallery Image
// @route   DELETE /api/restaurants/gallery/:imageId
// @access  Private (Restaurant Admin)
const deleteGalleryImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const targetId = req.restaurant?._id || req.user?._id || req.query.restaurantId;
        let restaurant;

        if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
            restaurant = await Restaurant.findById(targetId);
        }
        if (!restaurant) {
            restaurant = await Restaurant.findOne({ "gallery._id": imageId });
        }

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant or image not found" });
        }

        const imgIndex = restaurant.gallery.findIndex((g) => g._id.toString() === imageId);
        if (imgIndex === -1) {
            return res.status(404).json({ success: false, message: "Gallery image not found" });
        }

        const removedImg = restaurant.gallery[imgIndex];

        if (removedImg && removedImg.url && removedImg.url.startsWith("/uploads/gallery/")) {
            const fs = require("fs");
            const path = require("path");
            const filePath = path.join(__dirname, "..", removedImg.url);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.warn("Could not delete physical file:", e.message);
                }
            }
        }

        restaurant.gallery.splice(imgIndex, 1);
        await restaurant.save();

        console.log(`🗑️ Gallery image ${imageId} deleted from MongoDB`);

        res.json({
            success: true,
            message: "Gallery image deleted successfully",
        });
    } catch (error) {
        console.error("Delete Gallery Image Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to delete gallery image" });
    }
};

module.exports = {
    getAllRestaurants,
    getRestaurantById,
    getRestaurantImages,
    getRestaurantProfile,
    updateRestaurantImages,
    updateRestaurantProfile,
    getDashboardStats,
    verifyAdminPassword,
    changeAdminPassword,
    getRestaurantGallery,
    addGalleryImage,
    deleteGalleryImage,
};
