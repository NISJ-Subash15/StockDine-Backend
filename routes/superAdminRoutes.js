const express = require("express");
const router = express.Router();
const {
    superAdminLogin,
    getDashboardStats,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getAllRestaurants,
    approveRestaurant,
    rejectRestaurant,
    deleteRestaurant,
    getAllBookings,
    updateBookingStatus,
    getPaymentAnalytics,
    getAllReviews,
    deleteReview,
    getSupportTickets,
    updateSupportTicket,
    getPlatformSettings,
    updatePlatformSettings,
} = require("../controllers/superAdminController");
const { protect, superAdminOnly } = require("../middleware/authMiddleware");

// Public Super Admin Login Endpoint
router.post("/login", superAdminLogin);

// Protected Super Admin Endpoints (Require valid JWT and Super Admin Role)
router.use(protect, superAdminOnly);

// Metrics & Analytics
router.get("/dashboard-stats", getDashboardStats);
router.get("/payments", getPaymentAnalytics);

// User Management
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Restaurant Management & Moderation
router.get("/restaurants", getAllRestaurants);
router.patch("/restaurants/:id/approve", approveRestaurant);
router.patch("/restaurants/:id/reject", rejectRestaurant);
router.delete("/restaurants/:id", deleteRestaurant);

// Booking Oversight
router.get("/bookings", getAllBookings);
router.patch("/bookings/:id/status", updateBookingStatus);

// Review Moderation
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

// CRM Support Tickets
router.get("/crm", getSupportTickets);
router.patch("/crm/:id", updateSupportTicket);

// Global Platform Settings
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);

module.exports = router;
