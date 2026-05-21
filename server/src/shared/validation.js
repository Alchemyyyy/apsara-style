function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

function requireValue(res, value, fieldName) {
  if (value == null || String(value).trim() === "") {
    fail(res, `${fieldName} is required`);
    return null;
  }
  return value;
}

function parseInteger(res, value, fieldName, { min = null, max = null, defaultValue } = {}) {
  const input = value == null || value === "" ? defaultValue : value;
  const parsed = Number(input);

  if (!Number.isInteger(parsed)) {
    fail(res, `${fieldName} must be an integer`);
    return null;
  }

  if (min != null && parsed < min) {
    fail(res, `${fieldName} must be >= ${min}`);
    return null;
  }

  if (max != null && parsed > max) {
    fail(res, `${fieldName} must be <= ${max}`);
    return null;
  }

  return parsed;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function requireEmail(res, value, fieldName = "email") {
  const email = requireValue(res, value, fieldName);
  if (email == null) return null;

  const normalized = String(email).trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    fail(res, `${fieldName} is invalid`);
    return null;
  }

  return normalized;
}

module.exports = {
  fail,
  isValidEmail,
  parseInteger,
  requireEmail,
  requireValue,
};
