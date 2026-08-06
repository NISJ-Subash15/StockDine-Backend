const express = require("express");
const router = express.Router();
const {
    restaurantSignup,
    sendCustomerOTP,
    verifyCustomerOTP,
    customerSignup,
    login,
    updateCustomerProfile,
    getProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

// Restaurant Signup (supports logo and cover uploads)
router.post(
    "/signup",
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "cover", maxCount: 1 },
        { name: "restaurantLogo", maxCount: 1 },
        { name: "restaurantCover", maxCount: 1 },
    ]),
    restaurantSignup
);

// Customer OTP Auth Routes
router.post("/customer/send-otp", sendCustomerOTP);
router.post("/customer/verify-otp", verifyCustomerOTP);

// Customer Signup & Profile Update
router.post("/customer/signup", customerSignup);
router.put("/customer/profile", protect, updateCustomerProfile);

// Unified Login (Restaurant, Customer, Super Admin)
router.post("/login", login);

// Profile (Protected)
router.get("/profile", protect, getProfile);

module.exports = router;
