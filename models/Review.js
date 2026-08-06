const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        customerName: {
            type: String,
            required: [true, "Customer Name is required"],
            trim: true,
        },
        restaurantRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        foodRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        review: {
            type: String,
            trim: true,
            default: "",
        },
        reply: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Review", reviewSchema);
