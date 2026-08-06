const QRCode = require("qrcode");
const Restaurant = require("../models/Restaurant");
const Booking = require("../models/Booking");

// @desc    Generate QR Code for Restaurant
// @route   GET /api/qr/restaurant/:restaurantId
// @access  Public
const generateRestaurantQR = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const qrData = JSON.stringify({
            restaurantId: restaurant._id,
            customId: restaurant.restaurantId,
            name: restaurant.restaurantName,
            address: restaurant.address,
        });

        const qrDataUrl = await QRCode.toDataURL(qrData);

        res.json({
            success: true,
            restaurantName: restaurant.restaurantName,
            restaurantId: restaurant.restaurantId,
            qrCodeUrl: qrDataUrl,
        });
    } catch (error) {
        console.error("Generate QR Error:", error);
        res.status(500).json({ success: false, message: "Failed to generate QR code" });
    }
};

// @desc    Scan customer QR Code for Check-in
// @route   POST /api/qr/checkin
// @access  Private (Restaurant Admin)
const scanCustomerQR = async (req, res) => {
    try {
        const { bookingId, qrPayload } = req.body;

        let booking;

        if (bookingId) {
            booking = await Booking.findById(bookingId).populate("bookedItems.dish");
        } else if (qrPayload) {
            let parsedData;
            try {
                parsedData = typeof qrPayload === "string" ? JSON.parse(qrPayload) : qrPayload;
            } catch (e) {
                return res.status(400).json({ success: false, message: "Invalid QR code format" });
            }

            if (parsedData.bookingId) {
                booking = await Booking.findById(parsedData.bookingId);
            }
        }

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found for this QR code" });
        }

        if (booking.isCheckedIn) {
            return res.json({
                success: true,
                message: "Customer is ALREADY checked in",
                booking,
                alreadyCheckedIn: true,
            });
        }

        booking.isCheckedIn = true;
        booking.bookingStatus = "Preparing"; // Automatically send order to kitchen on checkin
        await booking.save();

        res.json({
            success: true,
            message: "Customer check-in successful!",
            booking,
        });
    } catch (error) {
        console.error("Scan Customer QR Error:", error);
        res.status(500).json({ success: false, message: "Check-in failed" });
    }
};

module.exports = {
    generateRestaurantQR,
    scanCustomerQR,
};
