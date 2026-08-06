const Booking = require("../models/Booking");

// @desc    View Incoming Kitchen Orders
// @route   GET /api/kitchen/orders
// @access  Private (Restaurant Admin / Kitchen)
const getKitchenOrders = async (req, res) => {
    try {
        const restaurantId = req.restaurant?._id || req.user?._id || req.query.restaurantId;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: "Restaurant ID is required" });
        }

        const orders = await Booking.find({
            restaurant: restaurantId,
            bookingStatus: { $in: ["Pending", "Confirmed", "Preparing", "Ready", "Served", "Cancelled", "Completed"] },
        })
            .populate("bookedItems.dish", "dishName dishImage preparationTime category")
            .sort({ createdAt: -1 });

        res.json({ success: true, count: orders.length, orders: orders || [] });
    } catch (error) {
        console.error("Get Kitchen Orders Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch kitchen orders" });
    }
};

// @desc    Update Kitchen Order Status (Pending, Preparing, Ready, Served, Cancelled, Completed)
// @route   PATCH /api/kitchen/orders/:id/status
// @access  Private (Restaurant Admin / Kitchen)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Pending", "Confirmed", "Preparing", "Ready", "Served", "Cancelled", "Completed"];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
            });
        }

        const order = await Booking.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order/Booking not found" });
        }

        order.bookingStatus = status;
        await order.save();

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            order,
        });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ success: false, message: "Failed to update order status" });
    }
};

module.exports = {
    getKitchenOrders,
    updateOrderStatus,
};
