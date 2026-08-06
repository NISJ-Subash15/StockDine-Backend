const mongoose = require("mongoose");
const dns = require("dns");

try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
    // Ignore if setServers is unavailable
}

let lastDbError = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        lastDbError = null;
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stockdine";
    const maskedUri = mongoUri.replace(/:([^@]+)@/, ":****@");
    console.log(`🔌 Attempting MongoDB connection to: ${maskedUri}`);

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            family: 4,
        });
        lastDbError = null;
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        lastDbError = error.message;
        console.error("\n❌ MongoDB Connection Error:", error.message);
        if (error.message.includes("ENOTFOUND")) {
            console.error("💡 DNS SRV Resolution Error: The cluster hostname in MONGODB_URI could not be found.");
            console.error("   Please verify the full cluster connection string from your MongoDB Atlas Dashboard (e.g. cluster0.xxxx.mongodb.net).");
        } else if (error.message.includes("bad auth")) {
            console.error("💡 Authentication Error: Incorrect username or password in MONGODB_URI.");
        } else {
            console.error("💡 Hint: Ensure local MongoDB service is running OR 0.0.0.0/0 is added to MongoDB Atlas Network Access!");
        }
        console.warn("⚠️ Express server will run in DB-fallback mode (serving HTTP 503 for database endpoints until reconnected).\n");
        return null;
    }
};

const getLastError = () => lastDbError;

module.exports = connectDB;
module.exports.getLastError = getLastError;
