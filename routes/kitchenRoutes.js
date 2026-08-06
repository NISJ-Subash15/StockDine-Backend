const express = require("express");
const router = express.Router();
const { getKitchenOrders, updateOrderStatus } = require("../controllers/kitchenController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");

// View incoming kitchen orders
router.get("/orders", protect, restaurantOnly, getKitchenOrders);

// Update order status (Pending, Preparing, Ready, Served, Cancelled, Completed)
router.patch("/orders/:id/status", protect, restaurantOnly, updateOrderStatus);

module.exports = router;
