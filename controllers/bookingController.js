const Booking = require("../models/Booking");
const Dish = require("../models/Dish");
const Table = require("../models/Table");
const QRCode = require("qrcode");

// @desc    Create a new booking (Table + Food Reservation)
// @route   POST /api/bookings
// @access  Public / Private (Customer)
const createBooking = async (req, res) => {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            restaurantId,
            bookedItems,
            tableNumber,
            guests,
            bookingDate,
            bookingTime,
        } = req.body;

        // Prioritize real authenticated user data from req.user if present
        const finalCustomerName = (req.user && req.user.name) ? req.user.name : customerName;
        const finalCustomerPhone = (req.user && req.user.mobile) ? req.user.mobile : (customerPhone || "");
        const finalCustomerEmail = (req.user && req.user.email) ? req.user.email : (customerEmail || "");

        if (!restaurantId || !finalCustomerName || !bookingDate || !bookingTime) {
            return res.status(400).json({ success: false, message: "Required booking fields missing (restaurantId, customerName, bookingDate, bookingTime)" });
        }

        let totalAmount = 0;
        let formattedBookedItems = [];

        // Calculate total amount & deduct dish portions
        if (bookedItems && Array.isArray(bookedItems) && bookedItems.length > 0) {
            for (const item of bookedItems) {
                const dishId = item.dishId || item.dish || item._id;
                const dish = await Dish.findById(dishId);
                if (dish) {
                    const qty = item.quantity || 1;
                    totalAmount += dish.price * qty;

                    // Deduct portion left
                    dish.portionsLeft = Math.max(0, dish.portionsLeft - qty);
                    if (dish.portionsLeft === 0) {
                        dish.available = false;
                    }
                    await dish.save();

                    formattedBookedItems.push({
                        dish: dish._id,
                        dishName: dish.dishName,
                        quantity: qty,
                        price: dish.price,
                    });
                }
            }
        }

        // Generate unique QR payload string for check-in
        const checkInPayload = JSON.stringify({
            restaurantId,
            customerName: finalCustomerName,
            date: bookingDate,
            time: bookingTime,
            timestamp: Date.now(),
        });

        // Generate QR code Data URL
        const qrCodeDataUrl = await QRCode.toDataURL(checkInPayload);

        const booking = await Booking.create({
            customerName: finalCustomerName,
            customerEmail: finalCustomerEmail,
            customerPhone: finalCustomerPhone,
            restaurant: restaurantId,
            user: req.user ? req.user._id : null,
            bookedItems: formattedBookedItems,
            tableNumber: tableNumber || "TBD",
            guests: guests ? parseInt(guests) : 1,
            bookingDate,
            bookingTime,
            totalAmount,
            paymentStatus: "Pending",
            bookingStatus: "Confirmed",
            qrCode: qrCodeDataUrl,
        });

        res.status(201).json({
            success: true,
            message: "Booking reserved and sent to restaurant instantly!",
            booking,
        });
    } catch (error) {
        console.error("Create Booking Error:", error);
        res.status(500).json({ success: false, message: error.message || "Booking creation failed" });
    }
};

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Public / Private
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("restaurant", "restaurantName address mobileNumber restaurantLogo restaurantCover")
            .populate("bookedItems.dish", "dishName dishImage price");

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch booking details" });
    }
};

// @desc    Get customer's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private (Customer)
const getMyBookings = async (req, res) => {
    try {
        let query = {};
        if (req.user) {
            query = { user: req.user._id };
        } else if (req.query.email) {
            query = { customerEmail: req.query.email };
        } else if (req.query.phone) {
            query = { customerPhone: req.query.phone };
        }

        const bookings = await Booking.find(query)
            .populate("restaurant", "restaurantName restaurantLogo address mobileNumber")
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bookings.length, bookings: bookings || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching customer bookings" });
    }
};

// @desc    Cancel Booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Public / Private
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.bookingStatus === "Cancelled") {
            return res.status(400).json({ success: false, message: "Booking is already cancelled" });
        }

        booking.bookingStatus = "Cancelled";
        await booking.save();

        // Restore dish portions
        if (booking.bookedItems && booking.bookedItems.length > 0) {
            for (const item of booking.bookedItems) {
                if (item.dish) {
                    const dish = await Dish.findById(item.dish);
                    if (dish) {
                        dish.portionsLeft += item.quantity;
                        dish.available = true;
                        await dish.save();
                    }
                }
            }
        }

        res.json({ success: true, message: "Booking cancelled successfully", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to cancel booking" });
    }
};

module.exports = {
    createBooking,
    getBookingById,
    getMyBookings,
    cancelBooking,
};
