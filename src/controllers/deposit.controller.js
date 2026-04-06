const depositService = require('../services/deposit.service');
const uploadService = require('../services/upload.service');
const { success, paginated } = require('../utils/response');

exports.create = async (req, res, next) => {
  try {
    const data = await depositService.create(req.body, req.user);
    return success(res, 201, 'Setoran berhasil dibuat', data);
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const result = await depositService.getAll(req.query, req.user);
    return paginated(res, 'Daftar deposit', result.data, result.pagination);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await depositService.getById(req.params.id, req.user);
    return success(res, 200, 'Detail deposit', data);
  } catch (err) {
    next(err);
  }
};

exports.getToday = async (req, res, next) => {
  try {
    const data = await depositService.getToday(req.user);
    return success(res, 200, 'Setoran hari ini', data);
  } catch (err) {
    next(err);
  }
};

exports.pay = async (req, res, next) => {
  try {
    let paymentProofUrl = null;
    if (req.file) {
      paymentProofUrl = await uploadService.upload(req.file);
    }
    const data = await depositService.pay(req.params.id, paymentProofUrl, req.user);
    return success(res, 200, 'Pembayaran berhasil dikonfirmasi', data);
  } catch (err) {
    next(err);
  }
};
