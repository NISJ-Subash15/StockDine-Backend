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
        console.log(`✅ MongoDB Atlas Connected Successfully`);
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("\n❌ MONGODB_URI is not defined in backend/.env!");
        throw new Error("MONGODB_URI is required.");
    }

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            family: 4,
        });
        lastDbError = null;
        console.log(`✅ MongoDB Atlas Connected Successfully`);
        return conn;
    } catch (primaryError) {
        lastDbError = primaryError.message;
        console.error("❌ MongoDB Atlas Connection Error:", primaryError.message);
        throw primaryError;
    }
};

const getLastError = () => lastDbError;

module.exports = connectDB;
module.exports.getLastError = getLastError;
