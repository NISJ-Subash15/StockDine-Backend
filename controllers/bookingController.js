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
            restaurantName,
            bookedItems,
            items,
            tableId,
            tableNumber,
            guests,
            bookingDate,
            bookingTime,
            date,
            time,
            totalAmount: inputTotalAmount,
            advanceAmount: inputAdvanceAmount,
        } = req.body;

        const finalCustomerName = (req.user && req.user.name) ? req.user.name : (customerName || "StockDine Diner");
        const finalCustomerPhone = (req.user && req.user.mobile) ? req.user.mobile : (customerPhone || "");
        const finalCustomerEmail = (req.user && req.user.email) ? req.user.email : (customerEmail || "");
        const finalDate = bookingDate || date;
        const finalTime = bookingTime || time;
        const rawRestId = restaurantId || req.body.restaurant;

        if (!rawRestId || !finalCustomerName || !finalDate || !finalTime) {
            return res.status(400).json({
                success: false,
                message: "Required booking fields missing (restaurantId, customerName, date/bookingDate, time/bookingTime)",
            });
        }

        const validRestId = await resolveRestaurantId(rawRestId);
        let finalRestaurantName = restaurantName || "StockDine Partner Venue";
        if (validRestId) {
            const rest = await Restaurant.findById(validRestId);
            if (rest) finalRestaurantName = rest.restaurantName;
        }

        const itemsToProcess = bookedItems || items || [];
        let calculatedTotalAmount = 0;
        let formattedBookedItems = [];

        if (Array.isArray(itemsToProcess) && itemsToProcess.length > 0) {
            for (const item of itemsToProcess) {
                const dishId = item.dishId || item.dish || item._id;
                let dish = null;
                if (dishId && mongoose.Types.ObjectId.isValid(dishId)) {
                    dish = await Dish.findById(dishId);
                }

                const qty = item.quantity || 1;
                const itemPrice = item.price || (dish ? dish.price : 0);
                calculatedTotalAmount += itemPrice * qty;

                if (dish) {
                    dish.portionsLeft = Math.max(0, dish.portionsLeft - qty);
                    if (dish.portionsLeft === 0) dish.available = false;
                    await dish.save();
                }

                formattedBookedItems.push({
                    dish: dish ? dish._id : null,
                    dishName: item.dishName || item.name || (dish ? dish.dishName : "Food Item"),
                    quantity: qty,
                    price: itemPrice,
                });
            }
        }

        const finalTotalAmount = (inputTotalAmount !== undefined && inputTotalAmount > 0) ? parseFloat(inputTotalAmount) : calculatedTotalAmount;
        const finalAdvanceAmount = (inputAdvanceAmount !== undefined) ? parseFloat(inputAdvanceAmount) : Math.round(finalTotalAmount * 0.2);
        const finalRemainingAmount = Math.max(0, finalTotalAmount - finalAdvanceAmount);

        const customBookingId = "#SD-BK-" + Math.floor(1000 + Math.random() * 9000);

        // Generate check-in QR Code Data URL
        const checkInPayload = JSON.stringify({
            bookingId: customBookingId,
            restaurantId: rawRestId,
            customerName: finalCustomerName,
            date: finalDate,
            time: finalTime,
            timestamp: Date.now(),
        });
        const qrCodeDataUrl = await QRCode.toDataURL(checkInPayload).catch(() => "");

        const booking = await Booking.create({
            bookingId: customBookingId,
            customerName: finalCustomerName,
            customerEmail: finalCustomerEmail,
            customerPhone: finalCustomerPhone,
            restaurant: validRestId || undefined,
            restaurantId: String(rawRestId),
            restaurantName: finalRestaurantName,
            user: req.user ? req.user._id : undefined,
            bookedItems: formattedBookedItems,
            tableId: tableId || undefined,
            tableNumber: tableNumber || "TBD",
            guests: guests ? parseInt(guests) : 2,
            bookingDate: finalDate,
            bookingTime: finalTime,
            totalAmount: finalTotalAmount,
            advanceAmount: finalAdvanceAmount,
            remainingAmount: finalRemainingAmount,
            paymentStatus: "Pending",
            bookingStatus: "Confirmed",
            qrCode: qrCodeDataUrl,
        });

        console.log(`✅ Table Reservation Confirmed in MongoDB: ${booking.bookingId} for ${finalCustomerName} at ${finalRestaurantName}`);

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
        let booking = await Booking.findById(req.params.id)
            .populate("restaurant", "restaurantName address mobileNumber restaurantLogo restaurantCover")
            .populate("bookedItems.dish", "dishName dishImage price");

        if (!booking) {
            booking = await Booking.findOne({ bookingId: req.params.id });
        }

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
            query = {
                $or: [
                    { user: req.user._id },
                    { customerEmail: req.user.email },
                    { customerPhone: req.user.mobile },
                ],
            };
        } else if (req.query.email) {
            query = { customerEmail: req.query.email };
        } else if (req.query.phone) {
            query = { customerPhone: req.query.phone };
        }

        const bookings = await Booking.find(query)
            .populate("restaurant", "restaurantName restaurantLogo address mobileNumber city")
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
