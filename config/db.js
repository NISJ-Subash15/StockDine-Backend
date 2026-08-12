const mongoose = require("mongoose");
const dns = require("dns");

// Configure DNS resolvers at module evaluation for reliable MongoDB Atlas SRV resolution
try {
    if (typeof dns.setDefaultResultOrder === "function") {
        dns.setDefaultResultOrder("ipv4first");
    }
    dns.setServers(["1.1.1.1", "8.8.8.8", "8.8.4.4", "1.0.0.1"]);
} catch (e) {
    // Fallback if DNS configuration is restricted
}

let lastDbError = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        lastDbError = null;
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const uriExists = Boolean(mongoUri);
    
    // Extract hostname safely without exposing credentials
    let hostnameOnly = "Unknown";
    if (uriExists) {
        const match = mongoUri.match(/@([^/?#]+)/);
        if (match && match[1]) {
            hostnameOnly = match[1];
        }
    }

    console.log(`🔍 Database Diagnostic Check:`);
    console.log(`   - MONGODB_URI exists: ${uriExists}`);
    console.log(`   - MongoDB Hostname: ${hostnameOnly}`);
    console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);

    if (!mongoUri) {
        console.error("\n❌ MONGODB_URI is not defined in backend/.env!");
        throw new Error("MONGODB_URI is required.");
    }

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
        lastDbError = null;
        console.log(`✅ MongoDB Connected Successfully`);
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
