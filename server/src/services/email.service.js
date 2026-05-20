function getMode() {
  return String(process.env.EMAIL_MODE || "disabled").trim().toLowerCase();
}

function isEmailEnabled() {
  const mode = getMode();
  return mode === "smtp" || mode === "console";
}

function buildResetUrl(resetToken) {
  const base = String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const qp = new URLSearchParams({
    mode: "reset",
    token: String(resetToken || ""),
  });
  return `${base}/login?${qp.toString()}`;
}

async function sendViaSmtp({ to, subject, text, html }) {
  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch {
    throw new Error("nodemailer is not installed. Run: npm --prefix server install nodemailer");
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || "APSARA STYLE <no-reply@apsara.local>";

  if (!host || !user || !pass) {
    throw new Error("SMTP config missing: set SMTP_HOST, SMTP_USER, SMTP_PASS");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, text, html });
}

async function dispatchEmail({ to, subject, text, html, consolePayload = {} }) {
  const mode = getMode();
  if (mode === "disabled") return { sent: false, mode };

  if (mode === "console") {
    console.log("[EMAIL:console]", { to, subject, ...consolePayload });
    return { sent: true, mode };
  }

  if (mode === "smtp") {
    await sendViaSmtp({ to, subject, text, html });
    return { sent: true, mode };
  }

  return { sent: false, mode };
}

async function sendPasswordResetEmail({ to, resetToken, expiresMinutes = 30 }) {
  const resetUrl = buildResetUrl(resetToken);
  const subject = "APSARA STYLE Password Reset";
  const text = [
    "We received a request to reset your password.",
    "",
    `Reset link: ${resetUrl}`,
    `This link expires in ${expiresMinutes} minutes.`,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <p>We received a request to reset your password.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in ${expiresMinutes} minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  const result = await dispatchEmail({
    to,
    subject,
    text,
    html,
    consolePayload: { resetUrl, expiresMinutes },
  });
  return { ...result, resetUrl };
}

function normalizeMoney(v) {
  return Number(v || 0).toFixed(2);
}

function returnReasonLabel(reason) {
  const map = {
    damaged: "Damaged item",
    wrong_item: "Wrong item",
    not_as_described: "Not as described",
    size_issue: "Size issue",
    other: "Other",
  };
  const key = String(reason || "").toLowerCase();
  return map[key] || key || "Other";
}

async function sendOrderPlacedEmail({ to, order, template }) {
  if (!to || !order) return { sent: false, mode: getMode() };
  const lead = String(template?.inAppMessage || "Thank you for your order.").trim();
  const subject = String(template?.emailSubject || `APSARA STYLE Order Confirmed - ${order.order_code}`).trim();
  const text = [
    lead,
    "",
    `Order code: ${order.order_code}`,
    `Status: ${String(order.status || "pending").toUpperCase()}`,
    `Total: $${normalizeMoney(order.total)}`,
    "",
    "Keep your order code to track your order.",
  ].join("\n");
  const html = `
    <p>${lead}</p>
    <p><strong>Order code:</strong> ${order.order_code}</p>
    <p><strong>Status:</strong> ${String(order.status || "pending").toUpperCase()}</p>
    <p><strong>Total:</strong> $${normalizeMoney(order.total)}</p>
    <p>Keep your order code to track your order.</p>
  `;

  return dispatchEmail({
    to,
    subject,
    text,
    html,
    consolePayload: { orderCode: order.order_code, status: order.status, total: order.total },
  });
}

async function sendOrderStatusChangedEmail({ to, order, previousStatus, nextStatus, template }) {
  if (!to || !order || !nextStatus) return { sent: false, mode: getMode() };
  const lead = String(template?.inAppMessage || "Your order status has been updated.").trim();
  const subject = String(
    template?.emailSubject ||
      `APSARA STYLE Order Update - ${order.order_code} is now ${String(nextStatus).toUpperCase()}`
  ).trim();
  const text = [
    lead,
    "",
    `Order code: ${order.order_code}`,
    previousStatus ? `Previous status: ${String(previousStatus).toUpperCase()}` : null,
    `Current status: ${String(nextStatus).toUpperCase()}`,
    `Total: $${normalizeMoney(order.total)}`,
  ].filter(Boolean).join("\n");
  const html = `
    <p>${lead}</p>
    <p><strong>Order code:</strong> ${order.order_code}</p>
    ${previousStatus ? `<p><strong>Previous status:</strong> ${String(previousStatus).toUpperCase()}</p>` : ""}
    <p><strong>Current status:</strong> ${String(nextStatus).toUpperCase()}</p>
    <p><strong>Total:</strong> $${normalizeMoney(order.total)}</p>
  `;

  return dispatchEmail({
    to,
    subject,
    text,
    html,
    consolePayload: {
      orderCode: order.order_code,
      previousStatus,
      nextStatus,
      total: order.total,
    },
  });
}

async function sendReturnRequestedEmail({ to, order, returnRequest, template }) {
  if (!to || !order || !returnRequest) return { sent: false, mode: getMode() };
  const reason = returnReasonLabel(returnRequest.reason);
  const lead = String(template?.inAppMessage || "We received your return request.").trim();
  const subject = String(
    template?.emailSubject || `APSARA STYLE Return Request Received - ${order.order_code}`
  ).trim();
  const text = [
    lead,
    "",
    `Order code: ${order.order_code}`,
    `Reason: ${reason}`,
    returnRequest.note ? `Note: ${returnRequest.note}` : null,
    `Status: ${String(returnRequest.status || "requested").toUpperCase()}`,
    "",
    "Our team will review your request and update you by email.",
  ].filter(Boolean).join("\n");
  const html = `
    <p>${lead}</p>
    <p><strong>Order code:</strong> ${order.order_code}</p>
    <p><strong>Reason:</strong> ${reason}</p>
    ${returnRequest.note ? `<p><strong>Note:</strong> ${returnRequest.note}</p>` : ""}
    <p><strong>Status:</strong> ${String(returnRequest.status || "requested").toUpperCase()}</p>
    <p>Our team will review your request and update you by email.</p>
  `;

  return dispatchEmail({
    to,
    subject,
    text,
    html,
    consolePayload: {
      orderCode: order.order_code,
      returnRequestId: returnRequest.id,
      reason: returnRequest.reason,
      status: returnRequest.status,
    },
  });
}

async function sendReturnStatusUpdatedEmail({
  to,
  order,
  returnRequest,
  previousStatus,
  nextStatus,
  statusNote,
  template,
}) {
  if (!to || !order || !returnRequest || !nextStatus) return { sent: false, mode: getMode() };
  const reason = returnReasonLabel(returnRequest.reason);
  const lead = String(template?.inAppMessage || "Your return request status has been updated.").trim();
  const subject = String(
    template?.emailSubject ||
      `APSARA STYLE Return Update - ${order.order_code} is now ${String(nextStatus).toUpperCase()}`
  ).trim();
  const note = String(statusNote || "").trim();
  const text = [
    lead,
    "",
    `Order code: ${order.order_code}`,
    `Reason: ${reason}`,
    previousStatus ? `Previous status: ${String(previousStatus).toUpperCase()}` : null,
    `Current status: ${String(nextStatus).toUpperCase()}`,
    note ? `Note: ${note}` : null,
  ].filter(Boolean).join("\n");
  const html = `
    <p>${lead}</p>
    <p><strong>Order code:</strong> ${order.order_code}</p>
    <p><strong>Reason:</strong> ${reason}</p>
    ${previousStatus ? `<p><strong>Previous status:</strong> ${String(previousStatus).toUpperCase()}</p>` : ""}
    <p><strong>Current status:</strong> ${String(nextStatus).toUpperCase()}</p>
    ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
  `;

  return dispatchEmail({
    to,
    subject,
    text,
    html,
    consolePayload: {
      orderCode: order.order_code,
      returnRequestId: returnRequest.id,
      previousStatus,
      nextStatus,
      reason: returnRequest.reason,
      note: note || null,
    },
  });
}

module.exports = {
  isEmailEnabled,
  sendPasswordResetEmail,
  sendOrderPlacedEmail,
  sendOrderStatusChangedEmail,
  sendReturnRequestedEmail,
  sendReturnStatusUpdatedEmail,
};
