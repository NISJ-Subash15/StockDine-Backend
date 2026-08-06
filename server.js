const path = require("path");
const dotenv = require("dotenv");

// Execute dotenv.config() BEFORE requiring config/db or routes
dotenv.config({ path: path.join(__dirname, ".env") });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, "..", ".env") }); // fallback to root .env
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Route imports
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const dishRoutes = require("./routes/dishRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const tableRoutes = require("./routes/tableRoutes");
const kitchenRoutes = require("./routes/kitchenRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const qrRoutes = require("./routes/qrRoutes");
const staffRoutes = require("./routes/staffRoutes");

const app = express();

// Request logging middleware for every incoming API request
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
    });
    next();
});

// Middlewares & CORS Configuration
const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.includes("localhost") || origin.includes("127.0.0.1")) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health Check Endpoint (does not require DB)
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "StockDine Backend Running",
        version: "1.0.0",
        databaseStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        timestamp: new Date(),
    });
});

// Database Connection Readiness Middleware (intercepts /api requests if DB is unavailable)
app.use("/api", (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.warn(`[${new Date().toISOString()}] ⚠️ API Request Blocked: MongoDB state is ${mongoose.connection.readyState} (0=disconnected, 2=connecting, 3=disconnecting)`);
        return res.status(503).json({
            success: false,
            message: "Database connection is currently unavailable or initializing. Please verify MongoDB status and try again.",
            error: "Service Unavailable (MongoDB Disconnected)",
        });
    }
    next();
});

// API Route Mounts
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/restaurant", restaurantRoutes); // Alias for legacy/convenience
app.use("/api/dishes", dishRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/staff", staffRoutes);

// Centralized 404 & Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

let serverInstance = null;

/**
 * Checks if a specific TCP port is currently open and available.
 */
const isPortAvailable = (port) => {
    const net = require("net");
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once("error", () => resolve(false))
            .once("listening", () => {
                tester.once("close", () => resolve(true)).close();
            })
            .listen(port, "0.0.0.0");
    });
};

/**
 * Finds the first available TCP port starting from startPort.
 */
const findAvailablePort = async (startPort) => {
    let port = Number(startPort);
    while (port < startPort + 50) {
        if (await isPortAvailable(port)) {
            return port;
        }
        port++;
    }
    return startPort;
};

const startServer = async () => {
    if (serverInstance) {
        console.warn("⚠️ Server startup ignored: server instance is already running/initializing.");
        return serverInstance;
    }

    try {
        try {
            await connectDB();
        } catch (dbErr) {
            console.error("⚠️ Initial MongoDB Connection Attempt Failed. Backend will serve HTTP 503 for DB endpoints until connection restores.");
        }

        let targetPort = PORT;
        const available = await isPortAvailable(targetPort);

        if (!available) {
            const suggestedPort = await findAvailablePort(targetPort + 1);
            console.warn(`\n⚠️ PORT CONFLICT DETECTED: Port ${targetPort} is currently occupied by another process.`);
            console.warn(`💡 Suggested available port: ${suggestedPort}`);
            console.warn(`🚀 Automatically starting backend server on available port ${suggestedPort}...\n`);
            targetPort = suggestedPort;
        }

        const server = app.listen(targetPort, "0.0.0.0", () => {
            console.log(`🚀 StockDine Backend API running on http://localhost:${targetPort} & http://127.0.0.1:${targetPort}`);
        });

        serverInstance = server;

        server.on("error", async (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`\n❌ PORT CONFLICT DETECTED: Port ${targetPort} is occupied.`);
                const fallbackPort = await findAvailablePort(targetPort + 1);
                console.warn(`💡 Retrying automatically on fallback port ${fallbackPort}...`);
                serverInstance = app.listen(fallbackPort, "0.0.0.0", () => {
                    console.log(`🚀 StockDine Backend API running on http://localhost:${fallbackPort} & http://127.0.0.1:${fallbackPort}`);
                });
            } else {
                console.error("❌ Server Startup Error:", error.message || error);
            }
        });

        return server;
    } catch (err) {
        console.error("❌ Express Initialization Failed:", err.message || err);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };