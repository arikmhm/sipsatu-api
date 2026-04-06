const authService = require('../services/auth.service');
const { success } = require('../utils/response');

exports.register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return success(res, 201, 'Registrasi berhasil', data);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return success(res, 200, 'Login berhasil', data);
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const data = await authService.getProfile(req.user.id);
    return success(res, 200, 'Profil berhasil diambil', data);
  } catch (err) {
    next(err);
  }
};
