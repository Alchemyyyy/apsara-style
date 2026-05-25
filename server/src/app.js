require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const appConfig = require("./config/app.config");
const session = require("./middleware/session");
const { mountApiModules } = require("./modules");

const app = express();

// Swagger Configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "SABY ORDER API",
      version: "1.0.0",
      description: "API Documentation for Saby Order server",
    },
    servers: [
      {
        url: appConfig.serverUrl,
      },
    ],
  },
  apis: ["./src/modules/**/routes.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors({ origin: appConfig.clientOrigins, exposedHeaders: ["x-session-id"], credentials: true }));

app.use(express.json());

const uploadsDir = path.resolve(__dirname, "../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => res.json({ message: "SABY ORDER API running" }));

// add session middleware BEFORE cart routes
app.use(session);
mountApiModules(app);

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
  app.listen(appConfig.port, () => console.log(`🚀 Server running on http://localhost:${appConfig.port}`));
}

module.exports = app;
