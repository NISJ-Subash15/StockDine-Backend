const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        dishName: {
            type: String,
            required: [true, "Dish Name is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: 0,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        portionsLeft: {
            type: Number,
            default: 10,
            min: 0,
        },
        available: {
            type: Boolean,
            default: true,
        },
        dishImage: {
            type: String,
            default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
        },
        isVeg: {
            type: Boolean,
            default: true,
        },
        preparationTime: {
            type: String,
            default: "15-20 mins",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Dish", dishSchema);
