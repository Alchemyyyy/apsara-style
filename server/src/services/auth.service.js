const authRepo = require("../repositories/auth.repository");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { hashPassword, verifyPassword } = require("../utils/passwordHash");
const { signUserToken } = require("../utils/userToken");
const emailService = require("./email.service");
const googleClient = new OAuth2Client();

function appError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeAddress(address) {
  if (!address) return null;
  return {
    id: address.id,
    label: address.label || "Home",
    phone: address.phone || null,
    country: address.country || null,
    city: address.city || null,
    addressLine1: address.address_line1 || null,
    addressLine2: address.address_line2 || null,
    postalCode: address.postal_code || null,
    isDefault: Boolean(address.is_default),
  };
}

function sanitizeUser(user, defaultAddress = null) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    phone: defaultAddress?.phone || null,
    defaultAddress: sanitizeAddress(defaultAddress),
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeOAuthName(value, fallback = "Google User") {
  const raw = String(value || "").trim() || fallback;
  // users.full_name is varchar(120)
  return raw.slice(0, 120);
}

function normalizeText(value, maxLen) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLen);
}

function sanitizeAddressList(addresses) {
  return (Array.isArray(addresses) ? addresses : []).map((address) => sanitizeAddress(address));
}

function resolveGoogleAudiences() {
  return String(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function resolveFacebookConfig() {
  return {
    appId: String(process.env.FACEBOOK_APP_ID || "").trim(),
    appSecret: String(process.env.FACEBOOK_APP_SECRET || "").trim(),
  };
}

function verifyUserPassword(plain, storedHash) {
  const value = String(plain || "");
  const stored = String(storedHash || "");

  if (verifyPassword(value, stored)) return { ok: true, legacy: false };
  // Backward-compatible fallback for legacy plain text records.
  if (stored && value && stored === value) return { ok: true, legacy: true };
  return { ok: false, legacy: false };
}

async function issueAuthPayload(user) {
  const tokenVersion = Number(user?.token_version || 1);
  const token = signUserToken({
    sub: user.id,
    email: user.email,
    role: user.role || "customer",
    tv: tokenVersion,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
}

async function register({ fullName, email, password }) {
  const name = String(fullName || "").trim();
  const normalizedEmail = normalizeEmail(email);
  const plainPassword = String(password || "");

  if (!name) throw appError("fullName is required", 400);
  if (!normalizedEmail) throw appError("email is required", 400);
  if (!isValidEmail(normalizedEmail)) throw appError("email is invalid", 400);
  if (plainPassword.length < 6) throw appError("password must be at least 6 characters", 400);

  const exists = await authRepo.findUserByEmail(normalizedEmail);
  if (exists) throw appError("Email already registered", 409);

  const passwordHash = hashPassword(plainPassword);
  const user = await authRepo.createUser({
    fullName: name,
    email: normalizedEmail,
    passwordHash,
  });

  return issueAuthPayload(user);
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const plainPassword = String(password || "");
  if (!normalizedEmail || !plainPassword) throw appError("email and password are required", 400);

  const user = await authRepo.findUserByEmail(normalizedEmail);
  if (!user) throw appError("Invalid email or password", 401);

  const check = verifyUserPassword(plainPassword, user.password_hash);
  if (!check.ok) throw appError("Invalid email or password", 401);

  if (check.legacy) {
    const upgradedHash = hashPassword(plainPassword);
    await authRepo.updatePasswordHash({ userId: user.id, passwordHash: upgradedHash });
  }

  return issueAuthPayload(user);
}

async function loginWithGoogle({ idToken }) {
  const rawToken = String(idToken || "").trim();
  if (!rawToken) throw appError("credential is required", 400);

  const audiences = resolveGoogleAudiences();
  if (!audiences.length) throw appError("Google login is not configured", 500);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: rawToken,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    payload = ticket.getPayload() || {};
  } catch {
    throw appError("Invalid Google credential", 401);
  }

  const email = normalizeEmail(payload.email);
  if (!email || !isValidEmail(email)) throw appError("Google account email is invalid", 400);
  if (!payload.email_verified) throw appError("Google account email is not verified", 401);

  let user = await authRepo.findUserByEmail(email);
  if (!user) {
    const fallbackName = email.split("@")[0] || "Google User";
    const fullName = normalizeOAuthName(payload.name, fallbackName);
    const randomPassword = `oauth-google-${crypto.randomBytes(24).toString("hex")}`;
    try {
      user = await authRepo.createUser({
        fullName,
        email,
        passwordHash: hashPassword(randomPassword),
      });
    } catch (err) {
      // Handle rare race condition where same email is created concurrently.
      if (String(err?.code || "") === "23505") {
        user = await authRepo.findUserByEmail(email);
      } else {
        throw err;
      }
    }
  }

  // Account linking strategy: existing same-email account is reused.
  if (!user) throw appError("Unable to complete Google sign in", 500);
  return issueAuthPayload(user);
}

async function loginWithFacebook({ accessToken }) {
  const token = String(accessToken || "").trim();
  if (!token) throw appError("access_token is required", 400);

  const { appId, appSecret } = resolveFacebookConfig();
  if (!appId || !appSecret) throw appError("Facebook login is not configured", 500);

  let debugPayload;
  try {
    const debugUrl = new URL("https://graph.facebook.com/debug_token");
    debugUrl.searchParams.set("input_token", token);
    debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`);
    const debugRes = await fetch(debugUrl);
    debugPayload = await debugRes.json();
  } catch {
    throw appError("Unable to verify Facebook credential", 401);
  }

  const debugData = debugPayload?.data || {};
  if (!debugData?.is_valid) throw appError("Invalid Facebook credential", 401);
  if (String(debugData?.app_id || "") !== appId) throw appError("Invalid Facebook app audience", 401);

  const userId = String(debugData?.user_id || "").trim();
  if (!userId) throw appError("Invalid Facebook credential", 401);

  let profile;
  try {
    const profileUrl = new URL(`https://graph.facebook.com/${userId}`);
    profileUrl.searchParams.set("fields", "id,name,email");
    profileUrl.searchParams.set("access_token", token);
    const profileRes = await fetch(profileUrl);
    profile = await profileRes.json();
  } catch {
    throw appError("Unable to load Facebook profile", 401);
  }

  const email = normalizeEmail(profile?.email);
  if (!email || !isValidEmail(email)) {
    throw appError("Facebook account email is unavailable. Please use email login.", 400);
  }

  let user = await authRepo.findUserByEmail(email);
  if (!user) {
    const fallbackName = email.split("@")[0] || "Facebook User";
    const fullName = normalizeOAuthName(profile?.name, fallbackName);
    const randomPassword = `oauth-facebook-${crypto.randomBytes(24).toString("hex")}`;
    try {
      user = await authRepo.createUser({
        fullName,
        email,
        passwordHash: hashPassword(randomPassword),
      });
    } catch (err) {
      if (String(err?.code || "") === "23505") {
        user = await authRepo.findUserByEmail(email);
      } else {
        throw err;
      }
    }
  }

  // Account linking strategy: existing same-email account is reused.
  if (!user) throw appError("Unable to complete Facebook sign in", 500);
  return issueAuthPayload(user);
}

async function me(userId) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw appError("Unauthorized", 401);
  const defaultAddress = await authRepo.findDefaultAddressByUserId(userId);
  return sanitizeUser(user, defaultAddress);
}

async function updateMe(userId, payload) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw appError("Unauthorized", 401);

  const hasName = Object.prototype.hasOwnProperty.call(payload || {}, "fullName");
  const hasPhone = Object.prototype.hasOwnProperty.call(payload || {}, "phone");
  const hasDefaultAddress = Object.prototype.hasOwnProperty.call(payload || {}, "defaultAddress");
  if (!hasName && !hasPhone && !hasDefaultAddress) {
    throw appError("No profile changes provided", 400);
  }

  if (hasName) {
    const nextName = normalizeText(payload.fullName, 120);
    if (!nextName) throw appError("fullName is required", 400);
    await authRepo.updateUserFullName({ userId, fullName: nextName });
  }

  const normalizedPhoneInput = hasPhone ? normalizeText(payload.phone, 30) : "";
  if (hasPhone && !normalizedPhoneInput) {
    throw appError("phone is required", 400);
  }
  const normalizedPhone = hasPhone ? normalizedPhoneInput : undefined;

  if (hasDefaultAddress) {
    const rawAddress = payload.defaultAddress || {};
    const normalizedAddress = {
      label: normalizeText(rawAddress.label, 50) || "Home",
      phone:
        normalizeText(rawAddress.phone, 30) ||
        (normalizedPhone !== undefined ? normalizedPhone : ""),
      country: normalizeText(rawAddress.country, 80),
      city: normalizeText(rawAddress.city, 80),
      addressLine1: normalizeText(rawAddress.addressLine1, 255),
      addressLine2: normalizeText(rawAddress.addressLine2, 255) || null,
      postalCode: normalizeText(rawAddress.postalCode, 20) || null,
    };

    if (!normalizedAddress.phone) throw appError("defaultAddress.phone is required", 400);
    if (!normalizedAddress.country) throw appError("defaultAddress.country is required", 400);
    if (!normalizedAddress.city) throw appError("defaultAddress.city is required", 400);
    if (!normalizedAddress.addressLine1) throw appError("defaultAddress.addressLine1 is required", 400);

    await authRepo.upsertDefaultAddressForUser({
      userId,
      ...normalizedAddress,
    });
  } else if (normalizedPhone !== undefined) {
    const currentDefault = await authRepo.findDefaultAddressByUserId(userId);
    if (!currentDefault) {
      throw appError("Create a default address before setting phone", 400);
    }
    await authRepo.upsertDefaultAddressForUser({
      userId,
      label: currentDefault.label || "Home",
      phone: normalizedPhone,
      country: currentDefault.country || "Cambodia",
      city: currentDefault.city || "",
      addressLine1: currentDefault.address_line1 || "",
      addressLine2: currentDefault.address_line2 || null,
      postalCode: currentDefault.postal_code || null,
    });
  }

  return me(userId);
}

function normalizeAddressInput(raw, { requireAll = true } = {}) {
  const normalized = {
    label: normalizeText(raw?.label, 50) || "Home",
    phone: normalizeText(raw?.phone, 30),
    country: normalizeText(raw?.country, 80),
    city: normalizeText(raw?.city, 80),
    addressLine1: normalizeText(raw?.addressLine1, 255),
    addressLine2: normalizeText(raw?.addressLine2, 255) || null,
    postalCode: normalizeText(raw?.postalCode, 20) || null,
    isDefault: Boolean(raw?.isDefault),
  };
  if (requireAll) {
    if (!normalized.phone) throw appError("phone is required", 400);
    if (!normalized.country) throw appError("country is required", 400);
    if (!normalized.city) throw appError("city is required", 400);
    if (!normalized.addressLine1) throw appError("addressLine1 is required", 400);
  }
  return normalized;
}

async function listMyAddresses(userId) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw appError("Unauthorized", 401);
  const addresses = await authRepo.listAddressesByUserId(userId);
  return sanitizeAddressList(addresses);
}

async function createMyAddress(userId, payload) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw appError("Unauthorized", 401);
  const normalized = normalizeAddressInput(payload, { requireAll: true });
  const existing = await authRepo.listAddressesByUserId(userId);
  if (!existing.length) normalized.isDefault = true;
  const row = await authRepo.createAddressForUser({
    userId,
    ...normalized,
  });
  return sanitizeAddress(row);
}

async function updateMyAddress(userId, addressId, payload) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw appError("Unauthorized", 401);
  const target = await authRepo.findAddressByIdForUser({ userId, addressId });
  if (!target) throw appError("Address not found", 404);
  const normalized = normalizeAddressInput(payload, { requireAll: true });
  if (target.is_default && !normalized.isDefault) {
    const all = await authRepo.listAddressesByUserId(userId);
    const hasOtherDefault = all.some((a) => a.id !== addressId && a.is_default);
    if (!hasOtherDefault) normalized.isDefault = true;
  }
  const row = await authRepo.updateAddressForUser({
    userId,
    addressId,
    ...normalized,
  });
  return sanitizeAddress(row);
}

async function deleteMyAddress(userId, addressId) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw appError("Unauthorized", 401);
  const deleted = await authRepo.deleteAddressForUser({ userId, addressId });
  if (!deleted) throw appError("Address not found", 404);

  const addresses = await authRepo.listAddressesByUserId(userId);
  if (addresses.length && !addresses.some((a) => a.is_default)) {
    await authRepo.setDefaultAddressForUser({ userId, addressId: addresses[0].id });
  }
  return { deleted: true };
}

async function setMyDefaultAddress(userId, addressId) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw appError("Unauthorized", 401);
  const target = await authRepo.findAddressByIdForUser({ userId, addressId });
  if (!target) throw appError("Address not found", 404);
  const row = await authRepo.setDefaultAddressForUser({ userId, addressId });
  return sanitizeAddress(row);
}

async function changeMyPassword(userId, { currentPassword, newPassword, confirmPassword }) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw appError("Unauthorized", 401);

  const current = String(currentPassword || "");
  const next = String(newPassword || "");
  const confirm = String(confirmPassword || "");

  if (!current) throw appError("currentPassword is required", 400);
  if (!next) throw appError("newPassword is required", 400);
  if (next.length < 8) throw appError("newPassword must be at least 8 characters", 400);
  if (!confirm) throw appError("confirmPassword is required", 400);
  if (next !== confirm) throw appError("confirmPassword does not match", 400);
  if (current === next) throw appError("newPassword must be different from currentPassword", 400);

  const check = verifyUserPassword(current, user.password_hash);
  if (!check.ok) throw appError("Current password is incorrect", 401);

  const nextHash = hashPassword(next);
  await authRepo.updatePasswordHash({ userId: user.id, passwordHash: nextHash });
  await authRepo.bumpUserTokenVersion(user.id);
  const freshUser = await authRepo.findUserById(user.id);
  const authPayload = await issueAuthPayload(freshUser);
  return {
    message: "Password changed successfully. Other sessions were logged out.",
    token: authPayload.token,
    user: authPayload.user,
  };
}

function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken || "")).digest("hex");
}

function generateResetToken() {
  return crypto.randomBytes(24).toString("base64url");
}

async function forgotPassword({ email }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw appError("email is required", 400);
  if (!isValidEmail(normalizedEmail)) throw appError("email is invalid", 400);

  await authRepo.deleteExpiredResetTokens();
  const user = await authRepo.findUserByEmail(normalizedEmail);

  // Avoid user enumeration: always return success shape.
  if (!user) {
    return {
      message: "If your email exists, a reset instruction has been created.",
    };
  }

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresMinutes = 30;
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
  await authRepo.createResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const emailResult = await emailService.sendPasswordResetEmail({
    to: user.email,
    resetToken: rawToken,
    expiresMinutes,
  });

  const payload = {
    message: "If your email exists, a reset instruction has been created.",
  };

  // Demo fallback: expose reset token only when email is not enabled.
  if (!emailResult.sent && process.env.NODE_ENV !== "production") {
    payload.resetToken = rawToken;
    payload.expiresInMinutes = expiresMinutes;
    payload.resetUrl = emailResult.resetUrl;
  }

  return payload;
}

async function resetPassword({ token, newPassword }) {
  const rawToken = String(token || "").trim();
  const password = String(newPassword || "");
  if (!rawToken) throw appError("token is required", 400);
  if (password.length < 6) throw appError("newPassword must be at least 6 characters", 400);

  await authRepo.deleteExpiredResetTokens();
  const tokenHash = hashResetToken(rawToken);
  const resetRow = await authRepo.findValidResetToken(tokenHash);
  if (!resetRow) throw appError("Invalid or expired reset token", 400);

  const newHash = hashPassword(password);
  await authRepo.updatePasswordHash({ userId: resetRow.user_id, passwordHash: newHash });
  await authRepo.bumpUserTokenVersion(resetRow.user_id);
  await authRepo.markResetTokenUsed(resetRow.id);

  return { message: "Password has been reset. Please login with your new password." };
}

module.exports = {
  register,
  login,
  loginWithGoogle,
  loginWithFacebook,
  me,
  updateMe,
  listMyAddresses,
  createMyAddress,
  updateMyAddress,
  deleteMyAddress,
  setMyDefaultAddress,
  changeMyPassword,
  forgotPassword,
  resetPassword,
};
