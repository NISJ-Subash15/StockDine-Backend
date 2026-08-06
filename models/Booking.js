const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
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
            required: true,
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
                },
                dishName: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                price: { type: Number, required: true, min: 0 },
            },
        ],
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
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        bookingStatus: {
            type: String,
            enum: ["Pending", "Confirmed", "Preparing", "Ready", "Served", "Cancelled", "Completed"],
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
