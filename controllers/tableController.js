const Table = require("../models/Table");
const Restaurant = require("../models/Restaurant");
const mongoose = require("mongoose");

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

// @desc    Add Table
// @route   POST /api/tables
// @access  Private (Restaurant Admin)
const addTable = async (req, res) => {
    try {
        const rawRestId = req.restaurant?._id || req.user?._id || req.body.restaurantId || req.body.restaurant;
        const targetRestId = await resolveRestaurantId(rawRestId);

        if (!targetRestId) {
            return res.status(400).json({ success: false, message: "Valid Restaurant ID is required" });
        }

        let { tableName, tableNumber, capacity, tableType, description, section, isAvailable, status } = req.body;

        // Auto-increment table number calculation if not provided or to guarantee format TABLE 01, TABLE 02...
        if (!tableNumber || tableNumber.trim() === "") {
            const count = await Table.countDocuments({ restaurant: targetRestId });
            let nextNum = count + 1;
            let candidate = `TABLE ${String(nextNum).padStart(2, "0")}`;

            while (await Table.findOne({ restaurant: targetRestId, tableNumber: candidate })) {
                nextNum++;
                candidate = `TABLE ${String(nextNum).padStart(2, "0")}`;
            }
            tableNumber = candidate;
        } else {
            tableNumber = tableNumber.trim().toUpperCase();
            const existingTable = await Table.findOne({ restaurant: targetRestId, tableNumber });
            if (existingTable) {
                return res.status(400).json({ success: false, message: `Table '${tableNumber}' already exists for this restaurant. Please use a unique table number.` });
            }
        }

        // Image upload handling from Multer req.file
        let imagePath = "";
        if (req.file) {
            imagePath = `/uploads/tables/${req.file.filename}`;
        } else if (req.body.image) {
            imagePath = req.body.image;
        }

        const validStatus = ["Available", "Reserved", "Occupied", "Maintenance"].includes(status) ? status : "Available";
        const validTableType = ["Regular", "Window", "Family", "VIP", "Outdoor", "Rooftop", "Private Room"].includes(tableType) ? tableType : "Regular";

        const table = await Table.create({
            restaurant: targetRestId,
            tableName: tableName || `Table ${tableNumber}`,
            tableNumber,
            capacity: capacity ? parseInt(capacity) : 4,
            tableType: validTableType,
            description: description || "",
            image: imagePath,
            section: section || validTableType || "Main Dining",
            isAvailable: isAvailable !== undefined ? (isAvailable === "true" || isAvailable === true) : (validStatus === "Available"),
            status: validStatus,
        });

        res.status(201).json({ success: true, message: "Table added successfully", table });
    } catch (error) {
        console.error("Add Table Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to add table" });
    }
};

// @desc    Get all tables for a restaurant
// @route   GET /api/tables
// @access  Public / Private
const getTables = async (req, res) => {
    try {
        const rawRestId = req.restaurant?._id || req.user?._id || req.query.restaurantId;
        let query = {};

        if (rawRestId) {
            const targetRestId = await resolveRestaurantId(rawRestId);
            if (targetRestId) {
                query.restaurant = targetRestId;
            } else {
                return res.json({ success: true, count: 0, tables: [] });
            }
        }

        const tables = await Table.find(query).sort({ tableNumber: 1 });

        res.json({ success: true, count: tables.length, tables: tables || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch tables" });
    }
};

// @desc    Edit Table
// @route   PUT /api/tables/:id
// @access  Private (Restaurant Admin)
const editTable = async (req, res) => {
    try {
        const { tableName, tableNumber, capacity, tableType, description, section, isAvailable, status } = req.body;

        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        if (tableNumber && tableNumber.trim().toUpperCase() !== table.tableNumber) {
            const newNum = tableNumber.trim().toUpperCase();
            const exists = await Table.findOne({ restaurant: table.restaurant, tableNumber: newNum });
            if (exists) {
                return res.status(400).json({ success: false, message: `Table '${newNum}' already exists` });
            }
            table.tableNumber = newNum;
        }

        if (tableName) table.tableName = tableName;
        if (capacity !== undefined) table.capacity = parseInt(capacity);
        if (tableType && ["Regular", "Window", "Family", "VIP", "Outdoor", "Rooftop", "Private Room"].includes(tableType)) {
            table.tableType = tableType;
        }
        if (description !== undefined) table.description = description;
        if (section) table.section = section;

        // Image file update from Multer req.file
        if (req.file) {
            table.image = `/uploads/tables/${req.file.filename}`;
        } else if (req.body.image !== undefined) {
            table.image = req.body.image;
        }

        if (status && ["Available", "Reserved", "Occupied", "Maintenance"].includes(status)) {
            table.status = status;
            table.isAvailable = status === "Available";
        }
        if (isAvailable !== undefined) {
            table.isAvailable = isAvailable === "true" || isAvailable === true;
            if (!table.isAvailable && table.status === "Available") {
                table.status = "Occupied";
            } else if (table.isAvailable) {
                table.status = "Available";
            }
        }

        await table.save();

        res.json({ success: true, message: "Table updated successfully", table });
    } catch (error) {
        console.error("Edit Table Error:", error);
        res.status(500).json({ success: false, message: "Failed to update table" });
    }
};

// @desc    Delete Table
// @route   DELETE /api/tables/:id
// @access  Private (Restaurant Admin)
const deleteTable = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        await Table.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: "Table deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete table" });
    }
};

// @desc    Change Table Status (Available / Reserved / Occupied / Maintenance)
// @route   PATCH /api/tables/:id/availability
// @access  Private (Restaurant Admin)
const toggleTableAvailability = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        if (req.body.status && ["Available", "Reserved", "Occupied", "Maintenance"].includes(req.body.status)) {
            table.status = req.body.status;
            table.isAvailable = req.body.status === "Available";
        } else if (req.body.isAvailable !== undefined) {
            table.isAvailable = req.body.isAvailable === "true" || req.body.isAvailable === true;
            table.status = table.isAvailable ? "Available" : "Occupied";
        }

        await table.save();

        res.json({
            success: true,
            message: `Table ${table.tableNumber} status set to ${table.status}`,
            table,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to change table status" });
    }
};

module.exports = {
    addTable,
    getTables,
    editTable,
    deleteTable,
    toggleTableAvailability,
};
