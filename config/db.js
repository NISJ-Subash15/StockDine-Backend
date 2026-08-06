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
    console.log(`🔌 Attempting primary MongoDB connection to: ${maskedUri}`);

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 4000,
            connectTimeoutMS: 4000,
            family: 4,
        });
        lastDbError = null;
        console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
        return conn;
    } catch (primaryError) {
        // Attempt secondary fallback to local MongoDB if primary fails
        if (!mongoUri.includes("127.0.0.1") && !mongoUri.includes("localhost")) {
            console.log("🔌 Primary Atlas connection failed. Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/stockdine)...");
            try {
                const localConn = await mongoose.connect("mongodb://127.0.0.1:27017/stockdine", {
                    serverSelectionTimeoutMS: 3000,
                    connectTimeoutMS: 3000,
                    family: 4,
                });
                lastDbError = null;
                console.log(`✅ Local MongoDB Fallback Connected Successfully: ${localConn.connection.host}`);
                return localConn;
            } catch (fallbackErr) {
                // Ignore fallback error and report primary error
            }
        }

        lastDbError = primaryError.message;
        console.error("\n❌ MongoDB Connection Error:", primaryError.message);
        if (primaryError.message.includes("ENOTFOUND")) {
            console.error("💡 Invalid Hostname Error: 'stockdine.mongodb.net' or 'cluster0.mongodb.net' is a placeholder hostname.");
            console.error("   Please copy your EXACT cluster URL from MongoDB Atlas Dashboard (e.g., mongodb+srv://user:pass@cluster0.abcde.mongodb.net/stockdine) and paste it into backend/.env.");
        } else if (primaryError.message.includes("bad auth")) {
            console.error("💡 Authentication Error: Incorrect database username or password in MONGODB_URI.");
        } else {
            console.error("💡 Hint: Ensure 0.0.0.0/0 (Allow Anywhere) is added to MongoDB Atlas Network Access!");
        }
        console.warn("⚠️ Express server is running in DB-fallback mode (serving HTTP 503 for database endpoints until MONGODB_URI is updated).\n");
        return null;
    }
};

const getLastError = () => lastDbError;

module.exports = connectDB;
module.exports.getLastError = getLastError;
