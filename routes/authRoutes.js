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
    forgotPassword,
    resetPassword,
    changePassword,
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

// Legacy Customer OTP Auth Routes (retained for backward compatibility)
router.post("/customer/send-otp", sendCustomerOTP);
router.post("/customer/verify-otp", verifyCustomerOTP);

// Customer Signup & Signin
router.post("/customer/signup", customerSignup);
router.post("/customer/login", login);

// Password Security & Recovery
router.post("/forgot-password", forgotPassword);
router.post("/customer/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/customer/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);

// Unified Login (Restaurant, Customer, Super Admin)
router.post("/login", login);

// Logout (Public/Protected)
router.post("/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
});

// Profile (Protected)
router.get("/profile", protect, getProfile);
router.get("/me", protect, getProfile);
router.put("/profile", protect, updateCustomerProfile);
router.put("/customer/profile", protect, updateCustomerProfile);

module.exports = router;
