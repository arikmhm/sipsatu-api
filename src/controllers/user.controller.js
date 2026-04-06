const userService = require('../services/user.service');
const { success, paginated } = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const result = await userService.getAll(req.query);
    return paginated(res, 'Daftar user', result.data, result.pagination);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await userService.getById(req.params.id);
    return success(res, 200, 'Detail user', data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await userService.create(req.body);
    return success(res, 201, 'User berhasil dibuat', data);
  } catch (err) {
    next(err);
  }
};

exports.searchNasabah = async (req, res, next) => {
  try {
    const data = await userService.searchNasabah(req.query.q, req.user.waste_bank_id);
    return success(res, 200, 'Hasil pencarian nasabah', data);
  } catch (err) {
    next(err);
  }
};
