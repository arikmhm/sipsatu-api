const categoryService = require('../services/category.service');
const { success } = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const data = await categoryService.getAll();
    return success(res, 200, 'Daftar kategori sampah', data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await categoryService.create(req.body);
    return success(res, 201, 'Kategori berhasil dibuat', data);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await categoryService.update(req.params.id, req.body);
    return success(res, 200, 'Kategori berhasil diupdate', data);
  } catch (err) {
    next(err);
  }
};
