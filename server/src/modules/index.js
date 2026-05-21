const productsRoutes = require("./products/routes");
const cartRoutes = require("./cart/routes");
const ordersRoutes = require("./orders/routes");
const paymentsRoutes = require("./payments/routes");
const authRoutes = require("./auth/routes");
const eventsRoutes = require("./events/routes");
const searchRoutes = require("./search/routes");
const recommendationsRoutes = require("./recommendations/routes");
const stylistRoutes = require("./stylist/routes");
const adminAuthRoutes = require("./adminAuth/routes");
const adminRoutes = require("./admin/routes");
const adminAnalyticsRoutes = require("./adminAnalytics/routes");
const wishlistRoutes = require("./wishlist/routes");
const healthRoutes = require("./health/routes");
const notificationsRoutes = require("./notifications/routes");

function mountApiModules(app) {
  app.use("/api/health", healthRoutes);
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
}

module.exports = {
  mountApiModules,
};
