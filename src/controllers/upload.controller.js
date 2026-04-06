const uploadService = require('../services/upload.service');
const { success } = require('../utils/response');

exports.upload = async (req, res, next) => {
  try {
    const url = await uploadService.upload(req.file);
    return success(res, 200, 'Upload berhasil', { url });
  } catch (err) {
    next(err);
  }
};
