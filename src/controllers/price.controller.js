const priceService = require('../services/price.service');
const { success } = require('../utils/response');

exports.getLatest = async (req, res, next) => {
  try {
    const data = await priceService.getLatest(req.query.waste_bank_id);
    return success(res, 200, 'Daftar harga aktif', data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await priceService.create(req.body);
    return success(res, 201, 'Harga berhasil ditambahkan', data);
  } catch (err) {
    next(err);
  }
};
