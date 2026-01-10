require("dotenv").config();
const express = require("express");
const cors = require("cors");

const session = require("./middleware/session");

const productsRoutes = require("./routes/products.routes");
const cartRoutes = require("./routes/cart.routes");
const ordersRoutes = require("./routes/orders.routes");
const eventsRoutes = require("./routes/events.routes");
const searchRoutes = require("./routes/search.routes");
const recommendationsRoutes = require("./routes/recommendations.routes");
const stylistRoutes = require("./routes/stylist.routes");

const app = express();

app.use(cors({ origin: "http://localhost:5173", exposedHeaders: ["x-session-id"] }));
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "APSARA STYLE API running" }));

// add session middleware BEFORE cart routes
app.use(session);

app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/stylist", stylistRoutes);

// Basic error handler (keep simple now)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
