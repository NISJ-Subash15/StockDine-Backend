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
        console.error("\n❌ FATAL STARTUP ERROR: MONGODB_URI is not defined in backend/.env or Environment Variables!");
        console.error("💡 Please paste your complete MongoDB Atlas connection string into backend/.env:");
        console.error("   MONGODB_URI=mongodb+srv://<username>:<password>@<your-cluster-name>.mongodb.net/stockdine?retryWrites=true&w=majority");
        console.error("⛔ Server startup ABORTED.\n");
        throw new Error("MONGODB_URI is missing from backend/.env. Server startup aborted.");
    }

    if (mongoUri.includes("<username>") || mongoUri.includes("<password>") || mongoUri.includes("<actual-cluster>")) {
        console.error("\n❌ FATAL STARTUP ERROR: Placeholder detected in MONGODB_URI connection string!");
        console.error("💡 Please replace <username>, <password>, and cluster placeholders in backend/.env with actual MongoDB Atlas credentials.");
        console.error("⛔ Server startup ABORTED.\n");
        throw new Error("Invalid placeholder in MONGODB_URI. Server startup aborted.");
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
        console.error("\n❌ MongoDB Atlas Connection Error:", error.message);
        if (error.message.includes("ENOTFOUND")) {
            console.error("💡 DNS Resolution Error: The cluster hostname in MONGODB_URI was not found.");
            console.error("   Please verify the full cluster URL from your MongoDB Atlas Dashboard (e.g. cluster0.xxxx.mongodb.net).");
        } else if (error.message.includes("bad auth")) {
            console.error("💡 Authentication Error: Incorrect username or password in MONGODB_URI.");
        } else {
            console.error("💡 Hint: Ensure 0.0.0.0/0 (Allow Anywhere) is added to MongoDB Atlas Network Access!");
        }
        console.error("⛔ Server startup ABORTED.\n");
        throw error;
    }
};

module.exports = connectDB;
