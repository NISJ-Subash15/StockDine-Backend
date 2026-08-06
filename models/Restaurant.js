const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const restaurantSchema = new mongoose.Schema(
    {
        restaurantName: {
            type: String,
            required: [true, "Restaurant Name is required"],
            trim: true,
        },
        ownerName: {
            type: String,
            required: [true, "Owner Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        mobileNumber: {
            type: String,
            required: [true, "Mobile Number is required"],
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },
        restaurantId: {
            type: String,
            unique: true,
            required: true,
        },
        address: {
            type: String,
            required: [true, "Address is required"],
        },
        city: {
            type: String,
            default: "",
            trim: true,
        },
        state: {
            type: String,
            default: "",
            trim: true,
        },
        country: {
            type: String,
            default: "India",
            trim: true,
        },
        pincode: {
            type: String,
            default: "",
            trim: true,
        },
        openingHours: {
            type: String,
            default: "11:00 AM",
            trim: true,
        },
        closingHours: {
            type: String,
            default: "11:00 PM",
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        gstNumber: {
            type: String,
            default: "",
            trim: true,
        },
        fssaiNumber: {
            type: String,
            default: "",
            trim: true,
        },
        latitude: {
            type: Number,
            default: 0.0,
        },
        longitude: {
            type: Number,
            default: 0.0,
        },
        cuisine: {
            type: String,
            default: "Multi-Cuisine",
        },
        restaurantType: {
            type: String,
            default: "Fine Dining",
        },
        restaurantLogo: {
            type: String,
            default: "",
        },
        restaurantCover: {
            type: String,
            default: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=60",
        },
        rating: {
            type: Number,
            default: 4.5,
        },
        numReviews: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["Approved", "Pending", "Rejected"],
            default: "Approved",
        },
        role: {
            type: String,
            default: "restaurant",
        },
        adminPassword: {
            type: String,
            default: null,
        },
        adminPasswordProtection: {
            type: Boolean,
            default: true,
        },
        gallery: [
            {
                url: { type: String, required: true },
                category: { type: String, default: "Interior" },
                title: { type: String, default: "Restaurant Photo" },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Hash passwords before save
restaurantSchema.pre("save", async function () {
    if (this.isModified("password") && this.password && !this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    if (this.isModified("adminPassword") && this.adminPassword && !this.adminPassword.startsWith("$2a$") && !this.adminPassword.startsWith("$2b$")) {
        const salt = await bcrypt.genSalt(10);
        this.adminPassword = await bcrypt.hash(this.adminPassword, salt);
    }
});

// Compare main password method
restaurantSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password || enteredPassword === undefined || enteredPassword === null) return false;
    const cleanEntered = String(enteredPassword).trim();
    const rawEntered = String(enteredPassword);

    if (this.password === cleanEntered || this.password === rawEntered) return true;

    try {
        const cleanMatch = await bcrypt.compare(cleanEntered, this.password);
        if (cleanMatch) return true;
        const rawMatch = await bcrypt.compare(rawEntered, this.password);
        if (rawMatch) return true;
    } catch (e) {
        if (this.password === cleanEntered || this.password === rawEntered) return true;
    }
    return false;
};

// Compare Admin Portal Security Password method
restaurantSchema.methods.compareAdminPassword = async function (enteredPassword) {
    if (enteredPassword === undefined || enteredPassword === null) return false;
    const cleanEntered = String(enteredPassword).trim();
    const rawEntered = String(enteredPassword);

    if (this.adminPassword) {
        if (this.adminPassword === cleanEntered || this.adminPassword === rawEntered) return true;
        try {
            const cleanMatch = await bcrypt.compare(cleanEntered, this.adminPassword);
            if (cleanMatch) return true;
            const rawMatch = await bcrypt.compare(rawEntered, this.adminPassword);
            if (rawMatch) return true;
        } catch (e) {
            if (this.adminPassword === cleanEntered || this.adminPassword === rawEntered) return true;
        }
        return false;
    }

    // Fallback if custom adminPassword is not set: verify using account password
    return this.comparePassword(enteredPassword);
};

module.exports = mongoose.model("Restaurant", restaurantSchema);
