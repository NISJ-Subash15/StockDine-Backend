const Staff = require("../models/Staff");
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

// @desc    Add Staff Member
// @route   POST /api/staff
// @access  Private (Restaurant Admin)
const addStaff = async (req, res) => {
    try {
        const rawRestId = req.restaurant?._id || req.user?._id || req.body.restaurantId || req.body.restaurant;
        const targetRestId = await resolveRestaurantId(rawRestId);

        if (!targetRestId) {
            return res.status(400).json({ success: false, message: "Valid Restaurant ID is required" });
        }

        const { name, mobile, phone, email, role, password, status, profilePhoto } = req.body;
        const staffMobile = mobile || phone;

        if (!name || !staffMobile) {
            return res.status(400).json({ success: false, message: "Staff Name and Mobile Number are required" });
        }

        let photoUrl = profilePhoto || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=500&auto=format&fit=crop&q=60";
        if (req.file) {
            photoUrl = await uploadToCloudinary(req.file.path, "stockdine/staff");
        }

        const staff = await Staff.create({
            restaurant: targetRestId,
            name,
            mobile: staffMobile,
            email: email || "",
            role: role || "Kitchen Staff",
            password: password || "",
            profilePhoto: photoUrl,
            status: status || "Active",
        });

        res.status(201).json({
            success: true,
            message: "Staff member added successfully",
            staff,
        });
    } catch (error) {
        console.error("Add Staff Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to add staff member" });
    }
};

// @desc    Get all staff members for a restaurant
// @route   GET /api/staff
// @access  Private (Restaurant Admin)
const getStaff = async (req, res) => {
    try {
        const rawRestId = req.restaurant?._id || req.user?._id || req.query.restaurantId;
        let query = {};

        if (rawRestId) {
            const targetRestId = await resolveRestaurantId(rawRestId);
            if (targetRestId) {
                query.restaurant = targetRestId;
            } else {
                return res.json({ success: true, count: 0, staff: [] });
            }
        }

        const staffList = await Staff.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: staffList.length,
            staff: staffList || [],
        });
    } catch (error) {
        console.error("Get Staff Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch staff members" });
    }
};

// @desc    Edit Staff Member
// @route   PUT /api/staff/:id
// @access  Private (Restaurant Admin)
const editStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        const { name, mobile, email, role, password, status } = req.body;

        if (req.file) {
            staff.profilePhoto = await uploadToCloudinary(req.file.path, "stockdine/staff");
        }

        if (name) staff.name = name;
        if (mobile) staff.mobile = mobile;
        if (email !== undefined) staff.email = email;
        if (role) staff.role = role;
        if (password !== undefined) staff.password = password;
        if (status) staff.status = status;

        await staff.save();

        res.json({
            success: true,
            message: "Staff member updated successfully",
            staff,
        });
    } catch (error) {
        console.error("Edit Staff Error:", error);
        res.status(500).json({ success: false, message: "Failed to edit staff member" });
    }
};

// @desc    Delete Staff Member
// @route   DELETE /api/staff/:id
// @access  Private (Restaurant Admin)
const deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        await Staff.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Staff member deleted successfully",
        });
    } catch (error) {
        console.error("Delete Staff Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete staff member" });
    }
};

// @desc    Toggle Staff Active / Disabled Status
// @route   PATCH /api/staff/:id/status
// @access  Private (Restaurant Admin)
const toggleStaffStatus = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        staff.status = staff.status === "Active" ? "Disabled" : "Active";
        await staff.save();

        res.json({
            success: true,
            message: `Staff member ${staff.name} set to ${staff.status}`,
            staff,
        });
    } catch (error) {
        console.error("Toggle Staff Status Error:", error);
        res.status(500).json({ success: false, message: "Failed to toggle staff status" });
    }
};

module.exports = {
    addStaff,
    getStaff,
    editStaff,
    deleteStaff,
    toggleStaffStatus,
};
