require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const session = require("./middleware/session");

const productsRoutes = require("./routes/products.routes");
const cartRoutes = require("./routes/cart.routes");
const ordersRoutes = require("./routes/orders.routes");
const paymentsRoutes = require("./routes/payments.routes");
const authRoutes = require("./routes/auth.routes");
const eventsRoutes = require("./routes/events.routes");
const searchRoutes = require("./routes/search.routes");
const recommendationsRoutes = require("./routes/recommendations.routes");
const stylistRoutes = require("./routes/stylist.routes");
const adminAuthRoutes = require("./routes/adminAuth.routes");
const adminRoutes = require("./routes/admin.routes");
const adminAnalyticsRoutes = require("./routes/adminAnalytics.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const healthRoutes = require("./routes/health.routes");
const notificationsRoutes = require("./routes/notifications.routes");

const app = express();

// Swagger Configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "APSARA STYLE API",
      version: "1.0.0",
      description: "API Documentation for Apsara Style server",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors({ origin: "http://localhost:5173", exposedHeaders: ["x-session-id"], credentials: true }));

app.use(express.json());

const uploadsDir = path.resolve(__dirname, "../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => res.json({ message: "APSARA STYLE API running" }));
app.use("/api/health", healthRoutes);

// add session middleware BEFORE cart routes
app.use(session);

app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/stylist", stylistRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/notifications", notificationsRoutes);

// Basic error handler (keep simple now)
app.use((err, req, res, next) => {
  console.error(err);
  let status = Number(err?.status) || Number(err?.statusCode) || 500;

  // PostgreSQL error mapping for better API feedback
  if (err?.code === "23505") status = 409; // unique_violation
  if (err?.code === "23503") status = 409; // foreign_key_violation
  if (err?.code === "22P02") status = 400; // invalid_text_representation
  if (err?.code === "22001") status = 400; // string_data_right_truncation
  if (err?.code === "23502") status = 400; // not_null_violation
  if (err?.code === "23514") status = 400; // check_violation

  let error = "Server error";

  if (status < 500) {
    error = err?.message || "Request failed";
  } else if (err?.code === "23505") {
    const detail = String(err?.detail || "").toLowerCase();
    if (detail.includes("slug")) error = "Duplicate slug. Please use a different slug.";
    else if (detail.includes("sku")) error = "Duplicate SKU. Please use a different SKU.";
    else if (detail.includes("email")) error = "Email already exists.";
    else error = "Duplicate value already exists.";
  }

  res.status(status).json({ success: false, error });
});

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
