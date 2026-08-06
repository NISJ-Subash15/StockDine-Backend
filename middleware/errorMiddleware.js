// Centralized Error Handling Middleware

const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode || 500;
    
    console.error(`❌ Global Error Handler [${req.method} ${req.url}]:`, err.message);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
};

module.exports = { notFound, errorHandler };
