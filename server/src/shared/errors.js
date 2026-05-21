class AppError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    Object.assign(this, extra);
  }
}

function appError(message, status = 400, extra = {}) {
  return new AppError(message, status, extra);
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  appError,
  asyncHandler,
};
