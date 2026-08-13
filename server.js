const dns = require("dns");
try {
    if (typeof dns.setDefaultResultOrder === "function") {
        dns.setDefaultResultOrder("ipv4first");
    }
    dns.setServers(["1.1.1.1", "8.8.8.8", "8.8.4.4", "1.0.0.1"]);
} catch (e) {}

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
const menuRoutes = require("./routes/menuRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const tableRoutes = require("./routes/tableRoutes");
const kitchenRoutes = require("./routes/kitchenRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const qrRoutes = require("./routes/qrRoutes");
const staffRoutes = require("./routes/staffRoutes");
const searchRoutes = require("./routes/searchRoutes");

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
    "http://localhost:3005",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3005",
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
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health Check Endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "StockDine Backend Running",
        version: "1.0.0",
        databaseStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        timestamp: new Date(),
    });
});

// Database Connection Readiness Middleware
app.use("/api", (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        const lastErr = typeof connectDB.getLastError === "function" ? connectDB.getLastError() : null;
        console.warn(`[${new Date().toISOString()}] ⚠️ API Request Intercepted: MongoDB state is ${mongoose.connection.readyState} (0=disconnected, 2=connecting, 3=disconnecting)`);
        return res.status(503).json({
            success: false,
            message: "Database connection is currently unavailable. Please verify MONGODB_URI connection string in backend/.env.",
            error: lastErr || "Service Unavailable (MongoDB Disconnected)",
            databaseState: mongoose.connection.readyState,
        });
    }
    next();
});

// API Route Mounts (Primary & Compatibility Aliases)
app.use("/api/auth", authRoutes);
app.use("/api/login", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/table", tableRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/search", searchRoutes);

// Centralized 404 & Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const ensurePortAvailable = (port) => {
    if (process.platform === "win32") {
        try {
            const { execSync } = require("child_process");
            const netstatOut = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
            const lines = netstatOut.trim().split("\n");
            for (const line of lines) {
                if (line.includes("LISTENING")) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && String(pid) !== String(process.pid) && pid !== "0") {
                        console.log(`🧹 Clearing orphan process on port ${port} (PID ${pid})...`);
                        execSync(`taskkill /pid ${pid} /f`, { stdio: "ignore" });
                    }
                }
            }
        } catch (e) {}
    }
};

let serverInstance = null;

const startServer = async () => {
    if (serverInstance) {
        return serverInstance;
    }

    try {
        console.log("🚀 Starting Backend...");
        await connectDB();

        ensurePortAvailable(PORT);

        const server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Backend running on http://localhost:${PORT}\n`);
        });

        serverInstance = server;

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.warn(`\n⚠️ PORT CONFLICT: Port ${PORT} occupied. Clearing process...`);
                ensurePortAvailable(PORT);
                process.exit(1);
            } else {
                console.error("❌ Server Startup Error:", error.message || error);
                process.exit(1);
            }
        });

        return server;
    } catch (err) {
        console.error("❌ Backend Startup Failed:", err.message || err);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };