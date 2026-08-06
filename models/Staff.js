const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Staff Name is required"],
            trim: true,
        },
        mobile: {
            type: String,
            required: [true, "Mobile Number is required"],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },
        role: {
            type: String,
            enum: ["Kitchen Staff", "Cashier", "Manager", "Waiter"],
            default: "Kitchen Staff",
        },
        password: {
            type: String,
            default: "",
        },
        profilePhoto: {
            type: String,
            default: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=500&auto=format&fit=crop&q=60",
        },
        status: {
            type: String,
            enum: ["Active", "Disabled"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Staff", staffSchema);
