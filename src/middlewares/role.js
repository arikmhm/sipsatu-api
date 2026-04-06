const AppError = require('../utils/AppError');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Anda tidak memiliki akses');
    }
    next();
  };
};

module.exports = authorize;
