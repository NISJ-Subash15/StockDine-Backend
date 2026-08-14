const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        bookingId: {
            type: String,
            trim: true,
        },
        customerName: {
            type: String,
            required: [true, "Customer Name is required"],
            trim: true,
        },
        customerEmail: {
            type: String,
            trim: true,
        },
        customerPhone: {
            type: String,
            trim: true,
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: false,
        },
        restaurantName: {
            type: String,
            default: "Partner Restaurant",
            trim: true,
        },
        restaurantId: {
            type: String,
            trim: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        bookedItems: [
            {
                dish: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Dish",
                    required: false,
                },
                dishName: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                price: { type: Number, required: true, min: 0 },
            },
        ],
        tableId: {
            type: String,
            trim: true,
        },
        tableNumber: {
            type: String,
            default: "TBD",
        },
        guests: {
            type: Number,
            default: 1,
            min: 1,
        },
        bookingDate: {
            type: String,
            required: [true, "Booking Date is required"],
        },
        bookingTime: {
            type: String,
            required: [true, "Booking Time is required"],
        },
        totalAmount: {
            type: Number,
            default: 0,
        },
        advanceAmount: {
            type: Number,
            default: 0,
        },
        remainingAmount: {
            type: Number,
            default: 0,
        },
        paymentStatus: {
            type: String,
            default: "Pending",
        },
        bookingStatus: {
            type: String,
            default: "Confirmed",
        },
        qrCode: {
            type: String,
        },
        isCheckedIn: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Booking", bookingSchema);
