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

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stockdine";
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        console.warn("⚠️ MONGODB_URI not defined in environment! Defaulting to local MongoDB: mongodb://127.0.0.1:27017/stockdine");
    }

    const maskedUri = mongoUri.replace(/:([^@]+)@/, ":****@");
    console.log(`🔌 Attempting MongoDB connection to: ${maskedUri}`);

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            family: 4,
        });
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        if (error.message.includes("bad auth")) {
            console.error("💡 Authentication Error: Incorrect username or password in MONGODB_URI.");
        } else {
            console.error("💡 Hint: Ensure local MongoDB service is running OR 0.0.0.0/0 is added to MongoDB Atlas Network Access!");
        }
        throw error;
    }
};

module.exports = connectDB;
