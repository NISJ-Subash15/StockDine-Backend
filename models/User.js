const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
        },
        avatar: {
            type: String,
            default: "",
        },
        customerId: {
            type: String,
            unique: true,
            sparse: true,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        favouriteRestaurants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Restaurant",
            },
        ],
        role: {
            type: String,
            enum: ["customer", "restaurant", "kitchen", "superadmin", "super_admin"],
            default: "customer",
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
    if (!this.password || !this.isModified("password")) return;
    if (this.password && !this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
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

module.exports = mongoose.model("User", userSchema);
