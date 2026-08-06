const express = require("express");
const router = express.Router();
const {
    getAllRestaurantsAdmin,
    approveRestaurant,
    rejectRestaurant,
    deleteRestaurant,
    getAllCustomersAdmin,
    deleteCustomerAdmin,
    getPlatformAnalytics,
} = require("../controllers/adminController");
const { protect, superAdminOnly } = require("../middleware/authMiddleware");

// All routes require Super Admin role
router.use(protect, superAdminOnly);

// Restaurant management
router.get("/restaurants", getAllRestaurantsAdmin);
router.patch("/restaurants/:id/approve", approveRestaurant);
router.patch("/restaurants/:id/reject", rejectRestaurant);
router.delete("/restaurants/:id", deleteRestaurant);

// Customer management
router.get("/customers", getAllCustomersAdmin);
router.delete("/customers/:id", deleteCustomerAdmin);

// Platform Analytics
router.get("/analytics", getPlatformAnalytics);

module.exports = router;
