const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        tableName: {
            type: String,
            default: "Dining Table",
            trim: true,
        },
        tableNumber: {
            type: String,
            required: [true, "Table Number is required"],
            trim: true,
        },
        capacity: {
            type: Number,
            default: 4,
            min: 1,
        },
        tableType: {
            type: String,
            enum: ["Regular", "Window", "Family", "VIP", "Outdoor", "Rooftop", "Private Room"],
            default: "Regular",
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        image: {
            type: String,
            default: "",
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ["Available", "Reserved", "Occupied", "Maintenance"],
            default: "Available",
        },
        section: {
            type: String,
            default: "Main Dining",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);
