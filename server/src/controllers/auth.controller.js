const authService = require("../services/auth.service");

const register = async (req, res, next) => {
  try {
    const data = await authService.register({
      fullName: req.body?.fullName,
      email: req.body?.email,
      password: req.body?.password,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login({
      email: req.body?.email,
      password: req.body?.password,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const loginWithGoogle = async (req, res, next) => {
  try {
    const data = await authService.loginWithGoogle({
      idToken: req.body?.credential || req.body?.idToken,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const loginWithFacebook = async (req, res, next) => {
  try {
    const data = await authService.loginWithFacebook({
      accessToken: req.body?.access_token || req.body?.accessToken,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const data = await authService.me(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const data = await authService.updateMe(req.user.id, req.body || {});
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const listMyAddresses = async (req, res, next) => {
  try {
    const data = await authService.listMyAddresses(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createMyAddress = async (req, res, next) => {
  try {
    const data = await authService.createMyAddress(req.user.id, req.body || {});
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateMyAddress = async (req, res, next) => {
  try {
    const data = await authService.updateMyAddress(req.user.id, req.params.id, req.body || {});
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteMyAddress = async (req, res, next) => {
  try {
    const data = await authService.deleteMyAddress(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const setMyDefaultAddress = async (req, res, next) => {
  try {
    const data = await authService.setMyDefaultAddress(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const changeMyPassword = async (req, res, next) => {
  try {
    const data = await authService.changeMyPassword(req.user.id, {
      currentPassword: req.body?.currentPassword,
      newPassword: req.body?.newPassword,
      confirmPassword: req.body?.confirmPassword,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword({
      email: req.body?.email,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const data = await authService.resetPassword({
      token: req.body?.token,
      newPassword: req.body?.newPassword,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

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
