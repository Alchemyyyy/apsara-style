const { ok } = require("../../shared/responses");
const { asyncHandler } = require("../../shared/errors");
const authService = require("./service");

const register = asyncHandler(async (req, res) => {
  const data = await authService.register({
    fullName: req.body?.fullName,
    email: req.body?.email,
    password: req.body?.password,
  });
  ok(res, data);
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login({
    email: req.body?.email,
    password: req.body?.password,
  });
  ok(res, data);
});

const loginWithGoogle = asyncHandler(async (req, res) => {
  const data = await authService.loginWithGoogle({
    idToken: req.body?.credential || req.body?.idToken,
  });
  ok(res, data);
});

const loginWithFacebook = asyncHandler(async (req, res) => {
  const data = await authService.loginWithFacebook({
    accessToken: req.body?.access_token || req.body?.accessToken,
  });
  ok(res, data);
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user.id);
  ok(res, data);
});

const updateMe = asyncHandler(async (req, res) => {
  const data = await authService.updateMe(req.user.id, req.body || {});
  ok(res, data);
});

const listMyAddresses = asyncHandler(async (req, res) => {
  const data = await authService.listMyAddresses(req.user.id);
  ok(res, data);
});

const createMyAddress = asyncHandler(async (req, res) => {
  const data = await authService.createMyAddress(req.user.id, req.body || {});
  ok(res, data);
});

const updateMyAddress = asyncHandler(async (req, res) => {
  const data = await authService.updateMyAddress(req.user.id, req.params.id, req.body || {});
  ok(res, data);
});

const deleteMyAddress = asyncHandler(async (req, res) => {
  const data = await authService.deleteMyAddress(req.user.id, req.params.id);
  ok(res, data);
});

const setMyDefaultAddress = asyncHandler(async (req, res) => {
  const data = await authService.setMyDefaultAddress(req.user.id, req.params.id);
  ok(res, data);
});

const changeMyPassword = asyncHandler(async (req, res) => {
  const data = await authService.changeMyPassword(req.user.id, {
    currentPassword: req.body?.currentPassword,
    newPassword: req.body?.newPassword,
    confirmPassword: req.body?.confirmPassword,
  });
  ok(res, data);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword({
    email: req.body?.email,
  });
  ok(res, data);
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword({
    token: req.body?.token,
    newPassword: req.body?.newPassword,
  });
  ok(res, data);
});

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
