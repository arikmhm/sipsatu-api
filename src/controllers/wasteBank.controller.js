const wasteBankService = require('../services/wasteBank.service');
const { success } = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const data = await wasteBankService.getAll();
    return success(res, 200, 'Daftar bank sampah', data);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await wasteBankService.getById(req.params.id);
    return success(res, 200, 'Detail bank sampah', data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await wasteBankService.create(req.body);
    return success(res, 201, 'Bank sampah berhasil dibuat', data);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await wasteBankService.update(req.params.id, req.body);
    return success(res, 200, 'Bank sampah berhasil diupdate', data);
  } catch (err) {
    next(err);
  }
};
