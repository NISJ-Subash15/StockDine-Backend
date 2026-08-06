const Dish = require("../models/Dish");
const Restaurant = require("../models/Restaurant");
const mongoose = require("mongoose");
const { uploadToCloudinary } = require("../middleware/uploadMiddleware");

// Helper to resolve Restaurant ObjectId
const resolveRestaurantId = async (input) => {
    if (!input) return null;
    if (mongoose.Types.ObjectId.isValid(input)) {
        const found = await Restaurant.findById(input);
        if (found) return found._id;
    }
    const foundByCode = await Restaurant.findOne({ restaurantId: input });
    if (foundByCode) return foundByCode._id;
    return null;
};

// @desc    Add a new dish
// @route   POST /api/dishes
// @access  Private (Restaurant Admin)
const addDish = async (req, res) => {
    try {
        const rawRestId = req.restaurant?._id || req.user?._id || req.body.restaurantId || req.body.restaurant;
        const targetRestId = await resolveRestaurantId(rawRestId);

        if (!targetRestId) {
            return res.status(400).json({ success: false, message: "Valid Restaurant ID is required" });
        }

        const name = req.body.dishName || req.body.name;
        const category = req.body.category;
        const price = req.body.price;
        const description = req.body.description || "";
        const portions = req.body.portionsLeft !== undefined ? parseInt(req.body.portionsLeft) : (req.body.quantity !== undefined ? parseInt(req.body.quantity) : 10);
        const isVeg = req.body.isVeg === "false" || req.body.isVeg === false ? false : true;
        const prepTime = req.body.preparationTime || req.body.prepTime || "15-20 mins";
        const available = req.body.available !== undefined ? (req.body.available === "true" || req.body.available === true) : portions > 0;

        let dishImageUrl = req.body.dishImage || req.body.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60";
        if (typeof dishImageUrl === "object" && dishImageUrl.imageUrl) {
            dishImageUrl = dishImageUrl.imageUrl;
        }

        if (req.file) {
            dishImageUrl = await uploadToCloudinary(req.file.path, "stockdine/dishes");
        }

        if (!name || !category || price === undefined) {
            return res.status(400).json({ success: false, message: "Dish Name, Category, and Price are required" });
        }

        const dish = await Dish.create({
            restaurant: targetRestId,
            dishName: name,
            category,
            price: parseFloat(price),
            description,
            portionsLeft: portions,
            available,
            dishImage: dishImageUrl,
            isVeg,
            preparationTime: prepTime,
        });

        res.status(201).json({ success: true, message: "Dish added successfully", dish });
    } catch (error) {
        console.error("Add Dish Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to add dish" });
    }
};

// @desc    Get all dishes (or filter by restaurant, category, search, veg/non-veg)
// @route   GET /api/dishes
// @access  Public
const getDishes = async (req, res) => {
    try {
        const { restaurantId, category, search, vegOnly, availableOnly } = req.query;

        let query = {};

        if (restaurantId) {
            const targetRestId = await resolveRestaurantId(restaurantId);
            if (targetRestId) {
                query.restaurant = targetRestId;
            } else {
                return res.json({ success: true, count: 0, dishes: [] });
            }
        }

        if (category) {
            query.category = { $regex: category, $options: "i" };
        }

        if (search) {
            query.$or = [
                { dishName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
            ];
        }

        if (vegOnly === "true") {
            query.isVeg = true;
        } else if (vegOnly === "false") {
            query.isVeg = false;
        }

        if (availableOnly === "true") {
            query.available = true;
            query.portionsLeft = { $gt: 0 };
        }

        const dishes = await Dish.find(query).populate("restaurant", "restaurantName restaurantId address");

        res.json({ success: true, count: dishes.length, dishes: dishes || [] });
    } catch (error) {
        console.error("Get Dishes Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch dishes" });
    }
};

// @desc    Get single dish details
// @route   GET /api/dishes/:id
// @access  Public
const getDishById = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id).populate("restaurant", "restaurantName address mobileNumber");
        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }
        res.json({ success: true, dish });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching dish details" });
    }
};

// @desc    Edit Dish
// @route   PUT /api/dishes/:id
// @access  Private (Restaurant Admin)
const editDish = async (req, res) => {
    try {
        let dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }

        const ownerId = req.restaurant?._id || req.user?._id;
        if (ownerId && dish.restaurant.toString() !== ownerId.toString() && req.user?.role !== "superadmin") {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this dish" });
        }

        const { dishName, category, price, description, portionsLeft, available, isVeg, preparationTime } = req.body;

        if (req.file) {
            dish.dishImage = await uploadToCloudinary(req.file.path, "stockdine/dishes");
        }

        if (dishName) dish.dishName = dishName;
        if (category) dish.category = category;
        if (price !== undefined) dish.price = parseFloat(price);
        if (description !== undefined) dish.description = description;
        if (portionsLeft !== undefined) {
            dish.portionsLeft = parseInt(portionsLeft);
            dish.available = parseInt(portionsLeft) > 0;
        }
        if (available !== undefined) dish.available = available === "true" || available === true;
        if (isVeg !== undefined) dish.isVeg = isVeg === "true" || isVeg === true;
        if (preparationTime) dish.preparationTime = preparationTime;

        await dish.save();

        res.json({ success: true, message: "Dish updated successfully", dish });
    } catch (error) {
        console.error("Edit Dish Error:", error);
        res.status(500).json({ success: false, message: "Failed to edit dish" });
    }
};

// @desc    Delete Dish
// @route   DELETE /api/dishes/:id
// @access  Private (Restaurant Admin)
const deleteDish = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }

        const ownerId = req.restaurant?._id || req.user?._id;
        if (ownerId && dish.restaurant.toString() !== ownerId.toString() && req.user?.role !== "superadmin") {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this dish" });
        }

        await Dish.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Dish deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete dish" });
    }
};

// @desc    Upload Dish Image
// @route   POST /api/dishes/:id/upload-image
// @access  Private (Restaurant Admin)
const uploadDishImage = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Please upload an image file" });
        }

        const imageUrl = await uploadToCloudinary(req.file.path, "stockdine/dishes");
        dish.dishImage = imageUrl;
        await dish.save();

        res.json({ success: true, message: "Dish image uploaded successfully", dishImage: imageUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Image upload failed" });
    }
};

// @desc    Update Quantity / Portions Left
// @route   PATCH /api/dishes/:id/portions
// @access  Private (Restaurant Admin)
const updatePortions = async (req, res) => {
    try {
        const { portionsLeft } = req.body;
        const count = parseInt(portionsLeft);

        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }

        dish.portionsLeft = count;
        dish.available = count > 0;
        await dish.save();

        res.json({ success: true, message: "Portions updated successfully", dish });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update portions" });
    }
};

// @desc    Update Price
// @route   PATCH /api/dishes/:id/price
// @access  Private (Restaurant Admin)
const updatePrice = async (req, res) => {
    try {
        const { price } = req.body;
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }

        dish.price = parseFloat(price);
        await dish.save();

        res.json({ success: true, message: "Price updated successfully", dish });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update price" });
    }
};

// @desc    Update Description
// @route   PATCH /api/dishes/:id/description
// @access  Private (Restaurant Admin)
const updateDescription = async (req, res) => {
    try {
        const { description } = req.body;
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }

        dish.description = description || "";
        await dish.save();

        res.json({ success: true, message: "Description updated successfully", dish });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update description" });
    }
};

// @desc    Toggle Dish Availability Status
// @route   PATCH /api/dishes/:id/status
// @access  Private (Restaurant Admin)
const toggleStatus = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }

        dish.available = req.body.available !== undefined ? (req.body.available === "true" || req.body.available === true) : !dish.available;
        await dish.save();

        res.json({ success: true, message: `Dish availability updated to ${dish.available}`, dish });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to toggle dish status" });
    }
};

module.exports = {
    addDish,
    getDishes,
    getDishById,
    editDish,
    deleteDish,
    uploadDishImage,
    updatePortions,
    updatePrice,
    updateDescription,
    toggleStatus,
};
