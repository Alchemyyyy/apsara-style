function safeText(value) {
  return String(value || "").trim();
}

function valueOrFallback(value, fallback) {
  const text = safeText(value);
  return text || fallback;
}

const templates = {
  order_created: ({ orderCode }) => ({
    title: "Order placed",
    inAppMessage: `Order ${valueOrFallback(orderCode, "N/A")} was placed successfully.`,
    emailSubject: `Order ${valueOrFallback(orderCode, "N/A")} confirmed`,
  }),
  order_cancelled: ({ orderCode }) => ({
    title: "Order cancelled",
    inAppMessage: `Order ${valueOrFallback(orderCode, "N/A")} has been cancelled.`,
    emailSubject: `Order ${valueOrFallback(orderCode, "N/A")} cancelled`,
  }),
  order_status_updated: ({ orderCode, nextStatus }) => ({
    title: "Order status updated",
    inAppMessage: `Order ${valueOrFallback(orderCode, "N/A")} is now ${valueOrFallback(nextStatus, "updated")}.`,
    emailSubject: `Order ${valueOrFallback(orderCode, "N/A")} status updated`,
  }),
  return_requested: ({ orderCode }) => ({
    title: "Return request submitted",
    inAppMessage: `Return request submitted for order ${valueOrFallback(orderCode, "N/A")}.`,
    emailSubject: `Return requested for order ${valueOrFallback(orderCode, "N/A")}`,
  }),
  return_status_updated: ({ orderCode, nextStatus }) => ({
    title: "Return request updated",
    inAppMessage: `Return request for order ${valueOrFallback(orderCode, "N/A")} is now ${valueOrFallback(nextStatus, "updated")}.`,
    emailSubject: `Return request updated for order ${valueOrFallback(orderCode, "N/A")}`,
  }),
  payment_paid: ({ orderCode }) => ({
    title: "Payment confirmed",
    inAppMessage: `Payment received for order ${valueOrFallback(orderCode, "N/A")}.`,
    emailSubject: `Payment confirmed for order ${valueOrFallback(orderCode, "N/A")}`,
  }),
  payment_failed: ({ orderCode }) => ({
    title: "Payment failed",
    inAppMessage: `Payment failed for order ${valueOrFallback(orderCode, "N/A")}. Please try again.`,
    emailSubject: `Payment failed for order ${valueOrFallback(orderCode, "N/A")}`,
  }),
};

function buildNotificationTemplate(type, params = {}) {
  const key = safeText(type).toLowerCase();
  const builder = templates[key];
  if (!builder) {
    console.warn("[notification-template] missing template:", key);
    return {
      templateKey: key || "general",
      params,
      title: "Notification",
      inAppMessage: "You have a new update.",
      emailSubject: "New update",
    };
  }

  const result = builder(params || {});
  return {
    templateKey: key,
    params: params || {},
    title: valueOrFallback(result?.title, "Notification"),
    inAppMessage: valueOrFallback(result?.inAppMessage, "You have a new update."),
    emailSubject: valueOrFallback(result?.emailSubject, "New update"),
  };
}

module.exports = {
  buildNotificationTemplate,
};

