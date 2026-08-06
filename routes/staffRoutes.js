const express = require("express");
const router = express.Router();
const {
    addStaff,
    getStaff,
    editStaff,
    deleteStaff,
    toggleStaffStatus,
} = require("../controllers/staffController");
const { protect, restaurantOnly } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

// All staff routes require restaurant authentication
router.use(protect, restaurantOnly);

router.get("/", getStaff);
router.post("/", upload.single("profilePhoto"), addStaff);
router.put("/:id", upload.single("profilePhoto"), editStaff);
router.delete("/:id", deleteStaff);
router.patch("/:id/status", toggleStaffStatus);

module.exports = router;
