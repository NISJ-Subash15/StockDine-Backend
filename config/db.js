const mongoose = require("mongoose");
const dns = require("dns");

try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
    // Ignore if setServers is unavailable
}

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log(`✅ MongoDB Already Connected: ${mongoose.connection.host}`);
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("\n❌ FATAL ERROR: MONGODB_URI is not defined in backend/.env or Environment Variables!");
        console.error("💡 Please configure a valid MongoDB Atlas connection string (e.g. MONGODB_URI=mongodb+srv://...) in backend/.env.");
        console.error("⚠️ Server startup aborted due to missing MongoDB configuration.\n");
        throw new Error("MONGODB_URI is required. Server startup aborted.");
    }

    const maskedUri = mongoUri.replace(/:([^@]+)@/, ":****@");
    console.log(`🔌 Attempting MongoDB Atlas connection to: ${maskedUri}`);

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            family: 4,
        });
        console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error("❌ MongoDB Atlas Connection Error:", error.message);
        if (error.message.includes("bad auth")) {
            console.error("💡 Authentication Error: Incorrect username or password in MONGODB_URI.");
        } else {
            console.error("💡 Hint: Ensure 0.0.0.0/0 (Allow Anywhere) is added to MongoDB Atlas Network Access!");
        }
        throw error;
    }
};

module.exports = connectDB;
