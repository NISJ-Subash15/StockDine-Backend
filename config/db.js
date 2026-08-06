const mongoose = require("mongoose");
const dns = require("dns");

try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
    // Ignore if setServers is unavailable
}

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("❌ MONGODB_URI or MONGO_URI is not defined in Environment Variables.");
            return;
        }

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            family: 4, // Force IPv4 to prevent Render IPv6 resolution issues
        });
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        if (error.message.includes("bad auth")) {
            console.error("❌ MongoDB Authentication Error: Incorrect username or password in MONGODB_URI.");
        } else {
            console.error("❌ MongoDB Connection Error:", error.message);
            console.error("💡 Hint: Ensure 0.0.0.0/0 (Allow Anywhere) is added to MongoDB Atlas Network Access!");
        }
    }
};

module.exports = connectDB;
